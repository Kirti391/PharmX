const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth, requireRole } = require("../../common/middleware");
const { fail, ok } = require("../../common/http");
const User = require("../../models/User");
const PharmacyProfile = require("../../models/PharmacyProfile");
const StockistProfile = require("../../models/StockistProfile");
const DoctorProfile = require("../../models/DoctorProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const VerificationDocument = require("../../models/VerificationDocument");
const Report = require("../../models/Report");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");
const CompanyAuthorization = require("../../models/CompanyAuthorization");
const Requirement = require("../../models/Requirement");
const Opportunity = require("../../models/Opportunity");
const Appointment = require("../../models/Appointment");
const Message = require("../../models/Message");
const { recordAudit } = require("../../common/audit");
const { createNotification } = require("../notifications/service");
const { getDisplayProfile } = require("../profiles/service");
const { DOC_TYPES, PRODUCT_CATEGORIES, ROLES } = require("../../common/constants");

async function refreshBusinessVerification(userId, role) {
  const requiredByRole = {
    PHARMA_COMPANY: ["BUSINESS_REG"],
    PHARMACY: ["DRUG_LICENSE"],
    DISTRIBUTOR_STOCKIST: ["DRUG_LICENSE"],
  };
  const requiredDocuments = requiredByRole[role];
  if (!requiredDocuments) return;

  const documents = await VerificationDocument.find({
    userId,
    docType: { $in: requiredDocuments },
  })
    .sort({ createdAt: -1 })
    .select("docType status expiryDate");
  const currentApprovedByType = new Map();
  for (const document of documents) {
    if (
      document.status === "APPROVED" &&
      (!document.expiryDate || document.expiryDate > new Date()) &&
      !currentApprovedByType.has(document.docType)
    ) {
      currentApprovedByType.set(document.docType, document);
    }
  }
  const verified = requiredDocuments.every(
    (docType) => currentApprovedByType.has(docType)
  );
  const pending = documents.some((document) => document.status === "PENDING");
  const rejected = documents.some((document) => document.status === "REJECTED");
  const expired = documents.some(
    (document) =>
      document.status === "APPROVED" &&
      document.expiryDate &&
      document.expiryDate <= new Date()
  );
  const verificationStatus = verified
    ? "VERIFIED"
    : pending
      ? "PENDING"
      : rejected
        ? "REJECTED"
        : expired
          ? "EXPIRED"
          : "NOT_SUBMITTED";

  if (role === "PHARMA_COMPANY") {
    await PharmaCompanyProfile.updateOne(
      { userId },
      {
        $set: {
          businessVerified: verified,
          verificationStatus,
          ...(verified ? { verificationDate: new Date() } : {}),
        },
      }
    );
  } else if (role === "PHARMACY") {
    const currentLicence = currentApprovedByType.get("DRUG_LICENSE");
    await PharmacyProfile.updateOne(
      { userId },
      {
        $set: {
          businessVerified: verified,
          verificationStatus,
          licenceExpiryDate: currentLicence?.expiryDate || null,
          ...(verified ? { lastVerifiedDate: new Date() } : {}),
        },
      }
    );
  } else {
    const currentLicence = currentApprovedByType.get("DRUG_LICENSE");
    await StockistProfile.updateOne(
      { userId },
      {
        $set: {
          businessVerified: verified,
          licenceExpiryDate: currentLicence?.expiryDate || null,
        },
      }
    );
  }
}

async function refreshDoctorVerification(userId) {
  const documents = await VerificationDocument.find({
    userId,
    docType: "MEDICAL_REGISTRATION",
  })
    .sort({ createdAt: -1 })
    .select("status expiryDate reviewedAt");
  const now = new Date();
  const currentApproved = documents.find(
    (document) =>
      document.status === "APPROVED" &&
      (!document.expiryDate || document.expiryDate > now)
  );
  const pending = documents.some((document) => document.status === "PENDING");
  const rejected = documents.some((document) => document.status === "REJECTED");
  const registrationStatus = currentApproved
    ? "VERIFIED"
    : pending
      ? "PENDING"
      : rejected
        ? "REJECTED"
        : "NOT_SUBMITTED";
  await DoctorProfile.updateOne(
    { userId },
    {
      $set: {
        registrationStatus,
        businessVerified: Boolean(currentApproved),
        verificationDate: currentApproved?.reviewedAt || null,
        reVerificationDate: currentApproved?.expiryDate || null,
      },
    }
  );
}

function publicUser(u) {
  return {
    id: u._id,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.role) query.role = req.query.role;
    const rows = await User.find(query).sort({ createdAt: -1 });
    ok(res, rows.map(publicUser));
  })
);

router.patch(
  "/users/:id/verify",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");

    user.status = "ACTIVE";
    await user.save();

    await recordAudit({ userId: req.user.sub, action: "ADMIN_VERIFIED_USER", targetType: "User", targetId: user._id.toString() });
    await createNotification({
      userId: user._id,
      type: "VERIFICATION_UPDATE",
      title: "Account verified",
      body: "Your account has been verified and your dashboard is fully unlocked.",
    });
    ok(res, publicUser(user));
  })
);

router.patch(
  "/users/:id/reject",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
    const { reason } = req.body;

    user.status = "REJECTED";
    await user.save();
    await PharmacyProfile.updateOne(
      { userId: user._id },
      { $set: { businessVerified: false } }
    );
    await StockistProfile.updateOne(
      { userId: user._id },
      { $set: { businessVerified: false } }
    );
    await PharmaCompanyProfile.updateOne(
      { userId: user._id },
      { $set: { businessVerified: false, verificationStatus: "REJECTED" } }
    );
    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_REJECTED_USER",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { reason },
    }    );
    const rejectedCompany = await PharmaCompanyProfile.findOne({
      userId: user._id,
    }).select("_id");
    const rejectedAuthorizationScopes = [{ mrUserId: user._id }];
    if (rejectedCompany) {
      rejectedAuthorizationScopes.push({
        companyId: rejectedCompany._id,
      });
    }
    await CompanyAuthorization.updateMany(
      {
        $or: rejectedAuthorizationScopes,
        status: { $in: ["PENDING", "ACTIVE"] },
      },
      {
        $set: {
          status: "REVOKED",
          revokedAt: new Date(),
          reviewedBy: req.user.sub,
          reviewedAt: new Date(),
          rejectionReason:
            reason || "MR account was rejected by an administrator",
        },
      }
    );
    await createNotification({
      userId: user._id,
      type: "VERIFICATION_UPDATE",
      title: "Verification rejected",
      body: reason || "Your verification was rejected. Please resubmit your documents.",
    });
    ok(res, publicUser(user));
  })
);

router.patch(
  "/users/:id/suspend",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
    if (user.role === "ADMIN") {
      return fail(
        res,
        403,
        "ADMIN_RESTRICTION",
        "Administrator accounts cannot be suspended through user management"
      );
    }

    user.status = "SUSPENDED";
    await user.save();
    await Promise.all([
      PharmacyProfile.updateOne(
        { userId: user._id },
        { $set: { businessVerified: false } }
      ),
      StockistProfile.updateOne(
        { userId: user._id },
        { $set: { businessVerified: false } }
      ),
      PharmaCompanyProfile.updateOne(
        { userId: user._id },
        {
          $set: {
            businessVerified: false,
            verificationStatus: "REJECTED",
          },
        }
      ),
      DoctorProfile.updateOne(
        { userId: user._id },
        { $set: { businessVerified: false } }
      ),
    ]);
    const company = await PharmaCompanyProfile.findOne({
      userId: user._id,
    }).select("_id");
    const authorizationScopes = [{ mrUserId: user._id }];
    if (company) authorizationScopes.push({ companyId: company._id });
    await CompanyAuthorization.updateMany(
      {
        $or: authorizationScopes,
        status: { $in: ["PENDING", "ACTIVE"] },
      },
      {
        $set: {
          status: "REVOKED",
          revokedAt: new Date(),
          reviewedBy: req.user.sub,
          reviewedAt: new Date(),
          rejectionReason: "Account suspended by an administrator",
        },
      }
    );
    await recordAudit({ userId: req.user.sub, action: "ADMIN_SUSPENDED_USER", targetType: "User", targetId: user._id.toString() });
    await createNotification({
      userId: user._id,
      type: "SYSTEM",
      title: "Account suspended",
      body: "Your account has been suspended by an administrator.",
    });
    ok(res, publicUser(user));
  })
);

router.patch(
  "/users/:id/restore",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
    if (user.status !== "SUSPENDED") {
      return fail(
        res,
        409,
        "ACCOUNT_NOT_SUSPENDED",
        "Only suspended accounts can be restored"
      );
    }
    user.status = "ACTIVE";
    await user.save();
    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_RESTORED_USER",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { status: "ACTIVE" },
    });
    await createNotification({
      userId: user._id,
      type: "SYSTEM",
      title: "Account restored",
      body: "Your account access has been restored. Business verification status remains unchanged.",
    });
    ok(res, publicUser(user));
  })
);

router.get(
  "/verifications",
  asyncHandler(async (req, res) => {
    const status = req.query.status || "PENDING";
    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid verification status filter");
    }
    if (req.query.docType && !DOC_TYPES.includes(req.query.docType)) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid document type filter");
    }
    if (req.query.role && !ROLES.includes(req.query.role)) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid account role filter");
    }
    const query = { status };
    if (req.query.docType) query.docType = req.query.docType;
    if (req.query.role) {
      const matchingUsers = await User.find({ role: req.query.role }).distinct("_id");
      query.userId = { $in: matchingUsers };
    }
    const rows = await VerificationDocument.find(query)
      .sort({ createdAt: -1 })
      .limit(500);
    ok(
      res,
      await Promise.all(rows.map(async (r) => {
        const user = await User.findById(r.userId).select("email role");
        return {
        id: r._id,
        userId: r.userId,
        userEmail: user?.email || null,
        role: user?.role || null,
        docType: r.docType,
        companyId: r.companyId,
        fileUrl: r.fileUrl,
        expiryDate: r.expiryDate,
        status: r.status,
        createdAt: r.createdAt,
        };
      }))
    );
  })
);

router.patch(
  "/verifications/:id/approve",
  asyncHandler(async (req, res) => {
    const document = await VerificationDocument.findById(req.params.id);
    if (!document) {
      return fail(res, 404, "NOT_FOUND", "Verification document not found");
    }
    if (document.status !== "PENDING") {
      return fail(
        res,
        409,
        "DOCUMENT_ALREADY_REVIEWED",
        "Only pending documents can be approved"
      );
    }
    if (document.expiryDate && document.expiryDate <= new Date()) {
      return fail(
        res,
        409,
        "DOCUMENT_EXPIRED",
        "Expired documents cannot be approved; request a current document instead"
      );
    }

    document.status = "APPROVED";
    document.reviewedBy = req.user.sub;
    document.reviewedAt = new Date();
    document.rejectionReason = null;
    await document.save();

    if (document.docType === "MEDICAL_REGISTRATION") {
      await refreshDoctorVerification(document.userId);
    }
    await refreshBusinessVerification(
      document.userId,
      (await User.findById(document.userId).select("role"))?.role
    );

    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_APPROVED_VERIFICATION_DOCUMENT",
      targetType: "VerificationDocument",
      targetId: document._id.toString(),
      metadata: { docType: document.docType },
    });
    await createNotification({
      userId: document.userId,
      type: "VERIFICATION_UPDATE",
      title: "Verification document approved",
      body: `Your ${document.docType.toLowerCase().replaceAll("_", " ")} document was approved.`,
      data: { documentId: document._id },
    });
    ok(res, { id: document._id, status: document.status });
  })
);

router.patch(
  "/verifications/:id/reject",
  asyncHandler(async (req, res) => {
    const document = await VerificationDocument.findById(req.params.id);
    if (!document) {
      return fail(res, 404, "NOT_FOUND", "Verification document not found");
    }
    if (document.status !== "PENDING") {
      return fail(
        res,
        409,
        "DOCUMENT_ALREADY_REVIEWED",
        "Only pending documents can be rejected"
      );
    }
    const reason =
      typeof req.body.reason === "string"
        ? req.body.reason.trim().slice(0, 1000)
        : "";
    if (!reason) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "A rejection reason is required"
      );
    }

    document.status = "REJECTED";
    document.reviewedBy = req.user.sub;
    document.reviewedAt = new Date();
    document.rejectionReason = reason;
    await document.save();
    if (document.docType === "MEDICAL_REGISTRATION") {
      await refreshDoctorVerification(document.userId);
    }
    await refreshBusinessVerification(
      document.userId,
      (await User.findById(document.userId).select("role"))?.role
    );

    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_REJECTED_VERIFICATION_DOCUMENT",
      targetType: "VerificationDocument",
      targetId: document._id.toString(),
      metadata: { docType: document.docType, reason },
    });
    await createNotification({
      userId: document.userId,
      type: "VERIFICATION_UPDATE",
      title: "Verification document rejected",
      body: reason,
      data: { documentId: document._id },
    });
    ok(res, { id: document._id, status: document.status });
  })
);

router.get(
  "/authorizations",
  asyncHandler(async (req, res) => {
    const status = req.query.status || "PENDING";
    const rows = await CompanyAuthorization.find({ status }).sort({
      createdAt: -1,
    });
    ok(
      res,
      await Promise.all(
        rows.map(async (authorization) => {
          const [company, mr] = await Promise.all([
            PharmaCompanyProfile.findById(
              authorization.companyId
            ).select("companyName"),
            User.findById(authorization.mrUserId).select("_id role email"),
          ]);
          return {
            id: authorization._id,
            companyId: authorization.companyId,
            companyName: company?.companyName || "Unknown company",
            mrUserId: authorization.mrUserId,
            mrName: mr
              ? (await getDisplayProfile(mr._id, mr.role)).name
              : "Unknown MR",
            verificationDocumentId:
              authorization.verificationDocumentId,
            categories: authorization.categories,
            territories: authorization.territories,
            expiresAt: authorization.expiresAt,
            status: authorization.status,
            createdAt: authorization.createdAt,
          };
        })
      )
    );
  })
);

router.patch(
  "/authorizations/:id/approve",
  asyncHandler(async (req, res) => {
    const authorization = await CompanyAuthorization.findById(
      req.params.id
    );
    if (!authorization) {
      return fail(res, 404, "NOT_FOUND", "Authorization not found");
    }
    if (
      authorization.status !== "PENDING" ||
      authorization.expiresAt <= new Date()
    ) {
      return fail(
        res,
        409,
        "AUTHORIZATION_NOT_REVIEWABLE",
        "Only unexpired pending authorizations can be approved"
      );
    }
    const document = await VerificationDocument.findOne({
      _id: authorization.verificationDocumentId,
      userId: authorization.mrUserId,
      companyId: authorization.companyId,
      docType: "COMPANY_AUTHORIZATION",
      status: "APPROVED",
    });
    if (!document) {
      return fail(
        res,
        409,
        "APPROVED_DOCUMENT_REQUIRED",
        "The linked authorization document must be approved first"
      );
    }

    authorization.status = "ACTIVE";
    authorization.reviewedBy = req.user.sub;
    authorization.reviewedAt = new Date();
    await authorization.save();
    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_APPROVED_COMPANY_AUTHORIZATION",
      targetType: "CompanyAuthorization",
      targetId: authorization._id.toString(),
    });
    await createNotification({
      userId: authorization.mrUserId,
      type: "VERIFICATION_UPDATE",
      title: "Company authorization approved",
      body: "Your company representation authorization is now active.",
      data: { authorizationId: authorization._id },
    });
    ok(res, {
      id: authorization._id,
      status: authorization.status,
      reviewedAt: authorization.reviewedAt,
    });
  })
);

router.patch(
  "/authorizations/:id/reject",
  asyncHandler(async (req, res) => {
    const reason =
      typeof req.body.reason === "string"
        ? req.body.reason.trim().slice(0, 1000)
        : "";
    if (!reason) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "A rejection reason is required"
      );
    }
    const authorization = await CompanyAuthorization.findOneAndUpdate(
      { _id: req.params.id, status: "PENDING" },
      {
        $set: {
          status: "REJECTED",
          reviewedBy: req.user.sub,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      },
      { new: true }
    );
    if (!authorization) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Pending authorization not found"
      );
    }
    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_REJECTED_COMPANY_AUTHORIZATION",
      targetType: "CompanyAuthorization",
      targetId: authorization._id.toString(),
      metadata: { reason },
    });
    await createNotification({
      userId: authorization.mrUserId,
      type: "VERIFICATION_UPDATE",
      title: "Company authorization rejected",
      body: reason,
      data: { authorizationId: authorization._id },
    });
    ok(res, {
      id: authorization._id,
      status: authorization.status,
      rejectionReason: authorization.rejectionReason,
    });
  })
);

router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.status) {
      if (!["OPEN", "REVIEWED", "DISMISSED"].includes(req.query.status)) {
        return fail(res, 400, "VALIDATION_ERROR", "Invalid report status filter");
      }
      query.status = req.query.status;
    }
    if (req.query.reason) query.reason = req.query.reason;
    const rows = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(500);
    ok(
      res,
      rows.map((r) => ({
        id: r._id,
        reporterId: r.reporterId,
        targetUserId: r.targetUserId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  })
);

router.patch(
  "/reports/:id/status",
  asyncHandler(async (req, res) => {
    const parsed = z.object({
      status: z.enum(["REVIEWED", "DISMISSED", "OPEN"]),
      reason: z.string().trim().min(5).max(1000),
    }).safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "A status and reason are required"
      );
    }
    const report = await Report.findById(req.params.id);
    if (!report) return fail(res, 404, "NOT_FOUND", "Report not found");
    const previousStatus = report.status;
    report.status = parsed.data.status;
    await report.save();
    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_UPDATED_REPORT_STATUS",
      targetType: "Report",
      targetId: report._id.toString(),
      metadata: {
        previousStatus,
        status: report.status,
        reason: parsed.data.reason,
      },
    });
    ok(res, { id: report._id, status: report.status });
  })
);

router.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.action) query.action = String(req.query.action).slice(0, 120);
    if (req.query.targetId) query.targetId = String(req.query.targetId).slice(0, 120);
    if (req.query.actorId && !/^[a-f\d]{24}$/i.test(String(req.query.actorId))) {
      return fail(res, 400, "VALIDATION_ERROR", "Invalid audit actor ID");
    }
    if (req.query.actorId) {
      query.userId = req.query.actorId;
    }
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        const from = new Date(req.query.from);
        if (Number.isNaN(from.getTime())) {
          return fail(res, 400, "VALIDATION_ERROR", "Invalid audit start date");
        }
        query.createdAt.$gte = from;
      }
      if (req.query.to) {
        const to = new Date(req.query.to);
        if (Number.isNaN(to.getTime())) {
          return fail(res, 400, "VALIDATION_ERROR", "Invalid audit end date");
        }
        query.createdAt.$lte = to;
      }
    }
    const rows = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(500);
    ok(res, rows);
  })
);

router.get(
  "/analytics/overview",
  asyncHandler(async (req, res) => {
    async function countBy(Model, field) {
      const rows = await Model.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
      return rows.map((r) => ({ [field]: r._id, count: r.count }));
    }

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [usersByRole, usersByStatus, requirementsByStatus, opportunitiesByStatus, appointmentsByStatus, totalMessages, pendingVerifications, pendingAuthorizations, openReports, expiredDocuments, documentsExpiring30Days, unreadAdminNotifications] =
      await Promise.all([
        countBy(User, "role"),
        countBy(User, "status"),
        countBy(Requirement, "status"),
        countBy(Opportunity, "status"),
        countBy(Appointment, "status"),
        Message.countDocuments(),
        VerificationDocument.countDocuments({ status: "PENDING" }),
        CompanyAuthorization.countDocuments({ status: "PENDING" }),
        Report.countDocuments({ status: "OPEN" }),
        VerificationDocument.countDocuments({
          expiryDate: { $ne: null, $lte: now },
          status: "APPROVED",
        }),
        VerificationDocument.countDocuments({
          expiryDate: { $gt: now, $lte: in30Days },
          status: "APPROVED",
        }),
        Notification.countDocuments({ userId: req.user.sub, readAt: null }),
      ]);

    const statusCount = (status) =>
      usersByStatus.find((row) => row.status === status)?.count || 0;
    ok(res, {
      usersByRole,
      usersByStatus,
      requirementsByStatus,
      opportunitiesByStatus,
      appointmentsByStatus,
      totalMessages,
      pendingVerifications,
      pendingAuthorizations,
      openReports,
      expiredDocuments,
      documentsExpiring30Days,
      unreadAdminNotifications,
      activeUsers: statusCount("ACTIVE"),
      pendingUsers: statusCount("PENDING_VERIFICATION"),
      suspendedUsers: statusCount("SUSPENDED"),
      totalUsers: usersByRole.reduce((sum, row) => sum + row.count, 0),
    });
  })
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => ok(res, PRODUCT_CATEGORIES))
);

module.exports = router;
