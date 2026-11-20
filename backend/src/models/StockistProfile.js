const mongoose = require("mongoose");

const stockistProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true },
    type: {
      type: String,
      enum: ["STOCKIST", "DISTRIBUTOR", "C_AND_F_AGENT"],
      default: "STOCKIST",
    },
    serviceAreas: { type: [String], default: [] },
    productCategories: { type: [String], default: [] },
    associatedCompanies: { type: [String], default: [] },
    logoUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    contactPersonName: { type: String, default: "" },
    contactPersonDesignation: { type: String, default: "" },
    deliveryModes: { type: [String], default: [] },
    minimumOrderValue: { type: String, default: "" },
    pinCodes: { type: [String], default: [] },
    deliveryTimeHours: { type: Number, default: 24, min: 0 },
    deliveryWindow: { type: String, default: "" },
    minimumOrderBand: { type: String, default: "" },
    coldChain: { type: Boolean, default: false },
    storageCapacity: { type: String, default: "" },
    specialHandling: { type: String, default: "" },
    emergencySupply: { type: Boolean, default: false },
    returnPolicySummary: { type: String, default: "" },
    serviceStatus: {
      type: String,
      enum: ["AVAILABLE", "LIMITED", "UNAVAILABLE"],
      default: "AVAILABLE",
    },
    serviceDescription: { type: String, default: "" },
    businessVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
      default: "NOT_SUBMITTED",
    },
    licenceExpiryDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockistProfile", stockistProfileSchema);
