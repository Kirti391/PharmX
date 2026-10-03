const mongoose = require("mongoose");

const pharmaCompanyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    logoUrl: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    manufacturingLocation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    areasOfOperation: {
      type: [String],
      default: [],
    },

    productCategories: {
      type: [String],
      default: [],
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    contactPersonName: {
      type: String,
      default: "",
      trim: true,
    },

    contactPersonDesignation: {
      type: String,
      default: "",
      trim: true,
    },

    businessVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
      default: "PENDING",
    },

    verificationDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PharmaCompanyProfile",
  pharmaCompanyProfileSchema
);