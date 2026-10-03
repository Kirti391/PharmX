const express = require("express");
const { z } = require("zod");
const {
  asyncHandler,
  requireAuth,
  requireRole,
} = require("../../common/middleware");
const { created, fail, ok } = require("../../common/http");
const CompanyAuthorization = require("../../models/CompanyAuthorization");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const User = require("../../models/User");
const VerificationDocument = require("../../models/VerificationDocument");
const { recordAudit } = require("../../common/audit");
const { createNotification } = require("../notifications/service");
const { getDisplayProfile } = require("../profiles/service");

const router = express.Router();
router.use(requireAuth);

const requestSchema = z.object({
  companyId: z.string().regex(/^[a-f\d]{24}$/i),
  verificationDocumentId: z.string().regex(/^[a-f\d]{24}$/i),
  categories: z.array(z.string().trim().min(1).max(120)).min(1).max(30),
  territories: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
  expiresAt: z.string().datetime(),
});

async function hasCurrentCompanyRegistration(company) {
  return Boolean(
    await VerificationDocument.exists({
      userId: company.userId,
      docType: "BUSINESS_REG",
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    })
  );
}

async function serialize(row) {
  const [company, mr] = await Promise.all([
    PharmaCompanyProfile.findById(row.companyId).select(
      "companyName userId"
    ),
    User.findById(row.mrUserId).select("_id role"),
  ]);

  return {
    id: row._id,
    companyId: row.companyId,
    companyName: company?.companyName || "Unknown company",
    mrUserId: row.mrUserId,
    mr: mr
      ? {
          userId: mr._id,
          ...(await getDisplayProfile(mr._id, mr.role)),
        }
      : null,
    verificationDocumentId: row.verificationDocumentId,
    categories: row.categories,
    territories: row.territories,
    status:
      row.status === "ACTIVE" && row.expiresAt <= new Date()
        ? "EXPIRED"
        : row.status,
    expiresAt: row.expiresAt,
    reviewedAt: row.reviewedAt,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt,
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    let query;
    if (req.user.role === "MR") {
      query = { mrUserId: req.user.sub };
    } else if (req.user.role === "PHARMA_COMPANY") {
      const company = await PharmaCompanyProfile.findOne({
        userId: req.user.sub,
      }).select("_id");
      if (!company) {
        return fail(res, 404, "NOT_FOUND", "Company profile not found");
      }
      query = { companyId: company._id };
    } else {
      return fail(
        res,
        403,
        "ROLE_RESTRICTED",
        "Only MRs and pharmaceutical companies can view authorizations"
      );
    }

    const rows = await CompanyAuthorization.find(query).sort({
      createdAt: -1,
    });
    ok(res, await Promise.all(rows.map(serialize)));
  })
);

router.post(
  "/",
  requireRole("MR"),
  asyncHandler(async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid authorization request"
      );
    }
    const expiresAt = new Date(parsed.data.expiresAt);
    if (expiresAt <= new Date()) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "Authorization expiry must be in the future"
      );
    }

    const [company, mr, authorizationDocument] = await Promise.all([
      PharmaCompanyProfile.findOne({
        _id: parsed.data.companyId,
        businessVerified: true,
        verificationStatus: "VERIFIED",
      }).select("_id companyName userId"),
      User.findOne({
        _id: req.user.sub,
        role: "MR",
        status: "ACTIVE",
      }).select("_id"),
      VerificationDocument.findOne({
        _id: parsed.data.verificationDocumentId,
        userId: req.user.sub,
        companyId: parsed.data.companyId,
        docType: "COMPANY_AUTHORIZATION",
        status: "APPROVED",
        expiryDate: { $gt: new Date() },
      }).select("_id companyId expiryDate"),
    ]);

    if (!company) {
      return fail(
        res,
        403,
        "COMPANY_VERIFICATION_REQUIRED",
        "Only verified pharmaceutical companies can request an MR authorization"
      );
    }
    if (!(await hasCurrentCompanyRegistration(company))) {
      return fail(
        res,
        403,
        "COMPANY_LICENSE_EXPIRED",
        "Current approved company registration is required"
      );
    }
    if (!mr) {
      return fail(res, 404, "NOT_FOUND", "Active MR account not found");
    }
    if (!authorizationDocument) {
      return fail(
        res,
        403,
        "APPROVED_AUTHORIZATION_DOCUMENT_REQUIRED",
        "An admin-approved authorization document for this company and MR is required"
      );
    }
    if (
      authorizationDocument.expiryDate &&
      expiresAt > authorizationDocument.expiryDate
    ) {
      return fail(
        res,
        400,
        "AUTHORIZATION_EXCEEDS_DOCUMENT_VALIDITY",
        "The requested authorization cannot outlast the approved company authorization document"
      );
    }

    const existing = await CompanyAuthorization.findOne({
      companyId: company._id,
      mrUserId: mr._id,
      status: { $in: ["PENDING", "ACTIVE"] },
      expiresAt: { $gt: new Date() },
    });
    if (existing) {
      return fail(
        res,
        409,
        "AUTHORIZATION_ALREADY_EXISTS",
        "An active or pending authorization already exists for this MR"
      );
    }

    const authorization = await CompanyAuthorization.create({
      companyId: company._id,
      mrUserId: mr._id,
      requestedBy: mr._id,
      verificationDocumentId: authorizationDocument._id,
      categories: [...new Set(parsed.data.categories)],
      territories: [...new Set(parsed.data.territories)],
      expiresAt,
    });
    await recordAudit({
      userId: req.user.sub,
      action: "MR_AUTHORIZATION_REQUESTED",
      targetType: "CompanyAuthorization",
      targetId: authorization._id.toString(),
    });
    await createNotification({
      userId: company.userId,
      type: "VERIFICATION_UPDATE",
      title: "MR authorization request",
      body: `An MR requested authorization to represent ${company.companyName}.`,
      data: { authorizationId: authorization._id },
    });
    created(res, await serialize(authorization));
  })
);

router.patch(
  "/:id/approve",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const company = await PharmaCompanyProfile.findOne({
      userId: req.user.sub,
      businessVerified: true,
      verificationStatus: "VERIFIED",
    }).select("_id companyName userId");
    if (!company) {
      return fail(
        res,
        403,
        "COMPANY_VERIFICATION_REQUIRED",
        "Only verified pharmaceutical companies can approve MR authorizations"
      );
    }
    if (!(await hasCurrentCompanyRegistration(company))) {
      return fail(
        res,
        403,
        "COMPANY_LICENSE_EXPIRED",
        "Current approved company registration is required"
      );
    }
    const authorization = await CompanyAuthorization.findOne({
      _id: req.params.id,
      companyId: company._id,
      status: "PENDING",
      expiresAt: { $gt: new Date() },
    });
    if (!authorization) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Unexpired pending authorization request not found"
      );
    }
    const document = await VerificationDocument.findOne({
      _id: authorization.verificationDocumentId,
      userId: authorization.mrUserId,
      companyId: company._id,
      docType: "COMPANY_AUTHORIZATION",
      status: "APPROVED",
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    });
    if (
      !document ||
      (document.expiryDate && authorization.expiresAt > document.expiryDate)
    ) {
      return fail(
        res,
        409,
        "APPROVED_DOCUMENT_REQUIRED",
        "The authorization document must remain approved"
      );
    }

    authorization.status = "ACTIVE";
    authorization.reviewedBy = req.user.sub;
    authorization.reviewedAt = new Date();
    await authorization.save();
    await recordAudit({
      userId: req.user.sub,
      action: "COMPANY_AUTHORIZATION_APPROVED",
      targetType: "CompanyAuthorization",
      targetId: authorization._id.toString(),
    });
    await createNotification({
      userId: authorization.mrUserId,
      type: "VERIFICATION_UPDATE",
      title: "Company authorization approved",
      body: `${company.companyName} approved your company representation request.`,
      data: { authorizationId: authorization._id },
    });
    ok(res, await serialize(authorization));
  })
);

router.patch(
  "/:id/reject",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({ reason: z.string().trim().min(3).max(1000) })
      .safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "A rejection reason is required"
      );
    }
    const company = await PharmaCompanyProfile.findOne({
      userId: req.user.sub,
    }).select("_id companyName");
    if (!company) {
      return fail(res, 404, "NOT_FOUND", "Company profile not found");
    }
    const authorization = await CompanyAuthorization.findOneAndUpdate(
      {
        _id: req.params.id,
        companyId: company._id,
        status: "PENDING",
      },
      {
        $set: {
          status: "REJECTED",
          reviewedBy: req.user.sub,
          reviewedAt: new Date(),
          rejectionReason: parsed.data.reason,
        },
      },
      { new: true }
    );
    if (!authorization) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Pending authorization request not found"
      );
    }
    await recordAudit({
      userId: req.user.sub,
      action: "COMPANY_AUTHORIZATION_REJECTED",
      targetType: "CompanyAuthorization",
      targetId: authorization._id.toString(),
      metadata: { reason: parsed.data.reason },
    });
    await createNotification({
      userId: authorization.mrUserId,
      type: "VERIFICATION_UPDATE",
      title: "Company authorization declined",
      body: parsed.data.reason,
      data: { authorizationId: authorization._id },
    });
    ok(res, await serialize(authorization));
  })
);

router.patch(
  "/:id/revoke",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const company = await PharmaCompanyProfile.findOne({
      userId: req.user.sub,
    }).select("_id companyName");
    if (!company) {
      return fail(res, 404, "NOT_FOUND", "Company profile not found");
    }
    const authorization = await CompanyAuthorization.findOne({
      _id: req.params.id,
      companyId: company._id,
      status: "ACTIVE",
    });
    if (!authorization) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Active company authorization not found"
      );
    }

    authorization.status = "REVOKED";
    authorization.revokedAt = new Date();
    authorization.reviewedBy = req.user.sub;
    authorization.reviewedAt = new Date();
    await authorization.save();
    await recordAudit({
      userId: req.user.sub,
      action: "COMPANY_AUTHORIZATION_REVOKED",
      targetType: "CompanyAuthorization",
      targetId: authorization._id.toString(),
    });
    await createNotification({
      userId: authorization.mrUserId,
      type: "VERIFICATION_UPDATE",
      title: "Company authorization revoked",
      body: `${company.companyName} revoked your company representation authorization.`,
      data: { authorizationId: authorization._id },
    });
    ok(res, await serialize(authorization));
  })
);

module.exports = router;
