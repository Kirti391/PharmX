const mongoose = require("mongoose");

const companyAuthorizationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompanyProfile",
      required: true,
      index: true,
    },
    mrUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verificationDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VerificationDocument",
      required: true,
    },
    categories: {
      type: [String],
      required: true,
      validate: [(values) => values.length > 0, "At least one authorized category is required"],
    },
    territories: {
      type: [String],
      required: true,
      validate: [(values) => values.length > 0, "At least one authorized territory is required"],
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "REVOKED", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

companyAuthorizationSchema.index({
  companyId: 1,
  mrUserId: 1,
  status: 1,
});

module.exports = mongoose.model(
  "CompanyAuthorization",
  companyAuthorizationSchema
);
