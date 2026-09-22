const mongoose = require("mongoose");
const { APPLICATION_STATUSES } = require("../common/constants");

const opportunityApplicationSchema = new mongoose.Schema(
  {
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true },
    applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "PENDING" },
  },
  { timestamps: { createdAt: "appliedAt", updatedAt: true } }
);

module.exports = mongoose.model("OpportunityApplication", opportunityApplicationSchema);
