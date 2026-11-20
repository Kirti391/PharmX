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

    brandName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },

    entityType: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },

    yearEstablished: {
      type: Number,
      default: null,
      min: 1800,
      max: new Date().getFullYear(),
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

    supportEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid support email"],
    },

    expansionTerritories: {
      type: [String],
      default: [],
    },

    drugLicenceNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
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