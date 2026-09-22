const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { fail, ok } = require("../../common/http");
const { upload, fileUrl } = require("../../common/upload");
const { DOC_TYPES } = require("../../common/constants");
const VerificationDocument = require("../../models/VerificationDocument");

const router = express.Router();
router.use(requireAuth);

function serialize(d) {
  return {
    id: d._id,
    userId: d.userId,
    docType: d.docType,
    fileUrl: d.fileUrl,
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
    if (!req.file) return fail(res, 400, "VALIDATION_ERROR", "No file uploaded");

    const row = await VerificationDocument.create({
      userId: req.user.sub,
      docType,
      fileUrl: fileUrl(req, req.file.filename),
    });
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
