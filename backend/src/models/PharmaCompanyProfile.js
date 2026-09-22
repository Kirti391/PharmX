const mongoose = require("mongoose");

const pharmaCompanyProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    companyName: { type: String, required: true },
    logoUrl: { type: String, default: null },
    description: { type: String, default: "" },
    manufacturingLocation: { type: String, default: "" },
    areasOfOperation: { type: [String], default: [] },
    productCategories: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PharmaCompanyProfile", pharmaCompanyProfileSchema);
