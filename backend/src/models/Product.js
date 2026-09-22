const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "PharmaCompanyProfile", required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
