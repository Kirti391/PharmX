const mongoose = require("mongoose");
const { LEAD_STAGES } = require("../common/constants");

const leadHistorySchema = new mongoose.Schema(
  {
    fromStage: { type: String, default: null },
    toStage: { type: String, enum: LEAD_STAGES, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ownerRole: {
      type: String,
      enum: ["MR", "PHARMA_COMPANY", "DISTRIBUTOR_STOCKIST"],
      required: true,
    },
    ownerCompanyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompanyProfile",
      default: null,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    source: {
      type: String,
      enum: [
        "MANUAL",
        "REQUIREMENT",
        "OPPORTUNITY",
        "CONNECTION",
        "APPOINTMENT",
        "SEARCH",
      ],
      default: "MANUAL",
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, default: "", trim: true, maxlength: 120 },
    territory: { type: String, default: "", trim: true, maxlength: 120 },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH"],
      default: "NORMAL",
    },
    stage: { type: String, enum: LEAD_STAGES, default: "NEW", index: true },
    notes: { type: String, default: "", maxlength: 5000 },
    closeReason: { type: String, default: "", maxlength: 1000 },
    lastContactAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null, index: true },
    history: { type: [leadHistorySchema], default: [] },
  },
  { timestamps: true }
);

leadSchema.index({ ownerCompanyId: 1, stage: 1, updatedAt: -1 });
leadSchema.index({ createdBy: 1, stage: 1, updatedAt: -1 });

module.exports = mongoose.model("Lead", leadSchema);
