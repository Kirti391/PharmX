const mongoose = require("mongoose");
const { URGENCY_LEVELS, REQUIREMENT_STATUSES } = require("../common/constants");

const requirementSchema = new mongoose.Schema(
  {
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "PharmacyProfile", required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    urgency: { type: String, enum: URGENCY_LEVELS, default: "NORMAL" },
    status: { type: String, enum: REQUIREMENT_STATUSES, default: "OPEN" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Requirement", requirementSchema);
