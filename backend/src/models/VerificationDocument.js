const mongoose = require("mongoose");
const { DOC_TYPES, DOC_STATUSES } = require("../common/constants");

const verificationDocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    docType: { type: String, enum: DOC_TYPES, required: true },
    fileUrl: { type: String, required: true },
    status: { type: String, enum: DOC_STATUSES, default: "PENDING" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationDocument", verificationDocumentSchema);
