const mongoose = require("mongoose");
const { OPPORTUNITY_TYPES, OPPORTUNITY_STATUSES } = require("../common/constants");

const opportunitySchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "PharmaCompanyProfile", required: true },
    type: { type: String, enum: OPPORTUNITY_TYPES, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    categories: { type: [String], default: [] },
    territories: { type: [String], default: [] },
    status: { type: String, enum: OPPORTUNITY_STATUSES, default: "OPEN" },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
