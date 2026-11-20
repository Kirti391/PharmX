const mongoose = require("mongoose");

const {
  REQUIREMENT_STATUSES,
  MR_SUPPORT_REQUEST_TYPES,
  URGENCY_LEVELS,
} = require("../common/constants");

const REQUIREMENT_ROLES = [
  "PHARMACY",
  "COMPANY",
  "MR",
  "DISTRIBUTOR_STOCKIST",
];

const requirementSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmacyProfile",
      default: null,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    ownerRole: {
      type: String,
      enum: REQUIREMENT_ROLES,
      default: null,
      index: true,
    },
    targetRole: {
      type: String,
      enum: REQUIREMENT_ROLES,
      default: null,
      index: true,
    },
    requestType: {
      type: String,
      enum: MR_SUPPORT_REQUEST_TYPES,
      default: null,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    urgency: {
      type: String,
      enum: URGENCY_LEVELS,
      default: "NORMAL",
    },
    status: {
      type: String,
      enum: REQUIREMENT_STATUSES,
      default: "OPEN",
      index: true,
    },
    matchingCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

requirementSchema.index({
  status: 1,
  targetRole: 1,
  createdAt: -1,
});

requirementSchema.index({
  ownerId: 1,
  ownerRole: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Requirement", requirementSchema);
