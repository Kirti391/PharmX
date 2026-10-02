// const mongoose = require("mongoose");

// const {
//   URGENCY_LEVELS,
//   REQUIREMENT_STATUSES,
// } = require("../common/constants");

// const REQUIREMENT_ROLES = [
//   "PHARMACY",
//   "COMPANY",
//   "MR",
//   "DISTRIBUTOR_STOCKIST",
// ];

// const requirementSchema = new mongoose.Schema(
//   {
//     // Existing field — KEEP THIS because the current backend
//     // and existing pharmacy requirements depend on it.
//     pharmacyId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "PharmacyProfile",
//       default: null,
//       index: true,
//     },

//     // The account/profile that created the requirement.
//     // Optional for backward compatibility with existing records.
//     ownerId: {
//       type: mongoose.Schema.Types.ObjectId,
//       default: null,
//       index: true,
//     },

//     // Role of the person/company that created it.
//     ownerRole: {
//       type: String,
//       enum: REQUIREMENT_ROLES,
//       default: null,
//       index: true,
//     },

//     // Which role can see/respond to this requirement.
//     //
//     // Examples:
//     // PHARMACY -> DISTRIBUTOR_STOCKIST
//     // PHARMACY -> COMPANY
//     // PHARMACY -> MR
//     // COMPANY -> MR
//     // DISTRIBUTOR_STOCKIST -> MR
//     targetRole: {
//       type: String,
//       enum: REQUIREMENT_ROLES,
//       default: null,
//       index: true,
//     },

//     category: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     description: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     urgency: {
//       type: String,
//       enum: URGENCY_LEVELS,
//       default: "NORMAL",
//     },

//     status: {
//       type: String,
//       enum: REQUIREMENT_STATUSES,
//       default: "OPEN",
//       index: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Efficient role-based discovery.
// requirementSchema.index({
//   status: 1,
//   targetRole: 1,
//   createdAt: -1,
// });

// // Efficient owner lookup.
// requirementSchema.index({
//   ownerId: 1,
//   ownerRole: 1,
//   createdAt: -1,
// });

// module.exports = mongoose.model("Requirement", requirementSchema);

const mongoose = require("mongoose");

const RESPONSE_ROLES = [
  "COMPANY",
  "MR",
  "DISTRIBUTOR_STOCKIST",
];

const RESPONSE_STATUSES = [
  "PENDING",
  "SHORTLISTED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

const requirementResponseSchema = new mongoose.Schema(
  {
    // Pharmacy requirement being answered.
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
      index: true,
    },

    // Authenticated User._id of the supplier who responded.
    responderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Role of the supplier at the time of response.
    responderRole: {
      type: String,
      enum: RESPONSE_ROLES,
      required: true,
      index: true,
    },

    // Supplier's response/message to the Pharmacy.
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: RESPONSE_STATUSES,
      default: "PENDING",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * A supplier can respond only once to the same requirement.
 */
requirementResponseSchema.index(
  {
    requirementId: 1,
    responderUserId: 1,
  },
  {
    unique: true,
  }
);

/*
 * Useful for the Pharmacy Responses page:
 * latest responses first.
 */
requirementResponseSchema.index({
  requirementId: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "RequirementResponse",
  requirementResponseSchema
);

