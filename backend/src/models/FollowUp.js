const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    notes: { type: String, default: "", maxlength: 2000 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

followUpSchema.index({ ownerUserId: 1, status: 1, dueAt: 1 });

module.exports = mongoose.model("FollowUp", followUpSchema);
