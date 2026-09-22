const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    details: { type: String, default: "" },
    status: { type: String, enum: ["OPEN", "REVIEWED", "DISMISSED"], default: "OPEN" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
