const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { fail, ok } = require("../../common/http");
const { upload, fileUrl } = require("../../common/upload");
const { DOC_TYPES } = require("../../common/constants");
const VerificationDocument = require("../../models/VerificationDocument");
const DoctorProfile = require("../../models/DoctorProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const MRProfile = require("../../models/MRProfile");

const router = express.Router();
router.use(requireAuth);

function serialize(d) {
  return {
    id: d._id,
    userId: d.userId,
    docType: d.docType,
    companyId: d.companyId,
    fileUrl: d.fileUrl,
    expiryDate: d.expiryDate,
    status: d.status,
    reviewedAt: d.reviewedAt,
    rejectionReason: d.rejectionReason,
    createdAt: d.createdAt,
  };
}

router.post(
  "/documents",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const { docType } = req.body;
    if (!DOC_TYPES.includes(docType)) {
      return fail(res, 400, "VALIDATION_ERROR", `docType must be one of ${DOC_TYPES.join(", ")}`);
    }
    if (
      (req.user.role === "DOCTOR" &&
        !["ID_PROOF", "MEDICAL_REGISTRATION"].includes(docType)) ||
      (req.user.role !== "DOCTOR" &&
        docType === "MEDICAL_REGISTRATION") ||
      (docType === "COMPANY_AUTHORIZATION" &&
        req.user.role !== "MR")
    ) {
      return fail(
        res,
        400,
        "INVALID_DOCUMENT_TYPE",
        "This document type is not available for your account role"
      );
    }
    if (!req.file) return fail(res, 400, "VALIDATION_ERROR", "No file uploaded");

    const requiresExpiryDate = [
      "DRUG_LICENSE",
      "MEDICAL_REGISTRATION",
      "COMPANY_AUTHORIZATION",
    ].includes(docType);
    let expiryDate = null;
    if (requiresExpiryDate) {
      if (
        typeof req.body.expiryDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(req.body.expiryDate)
      ) {
        return fail(
          res,
          400,
          "VALIDATION_ERROR",
          "A valid expiryDate is required for this document"
        );
      }
      expiryDate = new Date(`${req.body.expiryDate}T23:59:59.999Z`);
      if (
        Number.isNaN(expiryDate.getTime()) ||
        expiryDate.toISOString().slice(0, 10) !== req.body.expiryDate ||
        expiryDate <= new Date()
      ) {
        return fail(
          res,
          400,
          "VALIDATION_ERROR",
          "Document expiry must be a valid future date"
        );
      }
    }

    let companyId = null;
    if (docType === "COMPANY_AUTHORIZATION") {
      if (
        typeof req.body.companyId !== "string" ||
        !/^[a-f\d]{24}$/i.test(req.body.companyId)
      ) {
        return fail(
          res,
          400,
          "VALIDATION_ERROR",
          "companyId is required for an authorization document"
        );
      }
      const [mrProfile, company] = await Promise.all([
        MRProfile.findOne({ userId: req.user.sub }).select("_id"),
        PharmaCompanyProfile.findOne({
          _id: req.body.companyId,
          businessVerified: true,
          verificationStatus: "VERIFIED",
        }).select("_id"),
      ]);
      if (!mrProfile) {
        return fail(res, 404, "NOT_FOUND", "MR profile not found");
      }
      if (!company) {
        return fail(
          res,
          404,
          "NOT_FOUND",
          "Verified pharmaceutical company not found"
        );
      }
      companyId = company._id;
    }

    const row = await VerificationDocument.create({
      userId: req.user.sub,
      docType,
      companyId,
      expiryDate,
      fileUrl: fileUrl(req, req.file.filename),
    });
    if (
      req.user.role === "DOCTOR" &&
      docType === "MEDICAL_REGISTRATION"
    ) {
      const currentApprovedRegistration =
        await VerificationDocument.exists({
          userId: req.user.sub,
          docType: "MEDICAL_REGISTRATION",
          status: "APPROVED",
          $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } },
          ],
        });
      if (!currentApprovedRegistration) {
        await DoctorProfile.updateOne(
          { userId: req.user.sub },
          {
            $set: {
              registrationStatus: "PENDING",
              businessVerified: false,
            },
          }
        );
      }
    }
    ok(res, serialize(row));
  })
);

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const rows = await VerificationDocument.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    ok(res, rows.map(serialize));
  })
);

module.exports = router;
