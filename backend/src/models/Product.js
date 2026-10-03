const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PharmaCompanyProfile",
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    activeIngredient: { type: String, default: "", trim: true, maxlength: 200 },
    strength: { type: String, default: "", trim: true, maxlength: 120 },
    dosageForm: { type: String, default: "", trim: true, maxlength: 120 },
    packSize: { type: String, default: "", trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: null, maxlength: 1000 },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ companyId: 1, status: 1, category: 1, name: 1 });

module.exports = mongoose.model("Product", productSchema);
