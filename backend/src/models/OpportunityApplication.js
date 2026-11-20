const mongoose = require("mongoose");
const { APPLICATION_STATUSES } = require("../common/constants");

const applicantProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, default: "" },
    profileImageUrl: { type: String, default: null },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    languages: { type: [String], default: [] },
    specializations: { type: [String], default: [] },
    territories: { type: [String], default: [] },
    workMode: { type: String, default: "" },
    availabilityStatus: { type: String, default: "" },
    preferredOpportunityTypes: { type: [String], default: [] },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
  },
  { _id: false }
);

const opportunityApplicationSchema = new mongoose.Schema(
  {
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true },
    applicantUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: "PENDING" },
    message: { type: String, maxlength: 2000, default: "" },
    applicantProfile: {
      type: applicantProfileSchema,
      default: () => ({}),
    },
  },
  { timestamps: { createdAt: "appliedAt", updatedAt: true } }
);

module.exports = mongoose.model("OpportunityApplication", opportunityApplicationSchema);
