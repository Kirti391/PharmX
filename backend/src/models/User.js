const mongoose = require("mongoose");
const { ROLES, ACCOUNT_STATUSES } = require("../common/constants");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ROLES },
    // No OTP/email/mobile verification step in this build — accounts are ACTIVE immediately
    // on signup. PENDING_VERIFICATION is still used, but only for the separate admin
    // business-verification workflow (see verification/admin modules), not login gating.
    status: { type: String, enum: ACCOUNT_STATUSES, default: "ACTIVE" },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
