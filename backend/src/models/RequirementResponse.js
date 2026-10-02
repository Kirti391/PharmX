const mongoose = require("mongoose");

const requirementResponseSchema = new mongoose.Schema(
  {
    requirementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Requirement",
      required: true,
      index: true,
    },

    responderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    responderRole: {
      type: String,
      enum: [
        "PHARMA_COMPANY",
        "COMPANY",
        "MR",
        "INDEPENDENT_MR",
        "DISTRIBUTOR_STOCKIST",
        "DISTRIBUTOR",
        "STOCKIST",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "SHORTLISTED",
        "ACCEPTED",
        "REJECTED",
        "WITHDRAWN",
      ],
      default: "PENDING",
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * A supplier can respond only once to a requirement.
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

module.exports = mongoose.model(
  "RequirementResponse",
  requirementResponseSchema
);