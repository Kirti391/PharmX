const mongoose = require("mongoose");

const stockistProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true },
    type: { type: String, enum: ["STOCKIST", "DISTRIBUTOR"], default: "STOCKIST" },
    serviceAreas: { type: [String], default: [] },
    productCategories: { type: [String], default: [] },
    associatedCompanies: { type: [String], default: [] },
    businessVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockistProfile", stockistProfileSchema);
