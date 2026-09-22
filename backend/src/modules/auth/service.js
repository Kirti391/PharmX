const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const RefreshToken = require("../../models/RefreshToken");
const MRProfile = require("../../models/MRProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const PharmacyProfile = require("../../models/PharmacyProfile");
const StockistProfile = require("../../models/StockistProfile");
const env = require("../../config/env");
const { ApiError } = require("../../common/http");
const { signAccessToken, signRefreshToken, hashToken } = require("../../common/tokens");
const { recordAudit } = require("../../common/audit");

const REFRESH_TTL_MS = env.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: user._id,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

/** Creates the minimal role-specific profile document that signup requires. */
async function createInitialProfile(userId, role, displayName, location) {
  if (role === "MR" || role === "INDEPENDENT_MR") {
    await MRProfile.create({ userId, fullName: displayName, isIndependent: role === "INDEPENDENT_MR" });
  } else if (role === "PHARMA_COMPANY") {
    await PharmaCompanyProfile.create({ userId, companyName: displayName });
  } else if (role === "PHARMACY") {
    if (!location) throw new ApiError(400, "VALIDATION_ERROR", "Pharmacy signup requires a location");
    await PharmacyProfile.create({ userId, pharmacyName: displayName, location });
  } else if (role === "STOCKIST" || role === "DISTRIBUTOR") {
    await StockistProfile.create({ userId, companyName: displayName, type: role });
  }
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await RefreshToken.create({ userId: user._id, tokenHash: hashToken(refreshToken), expiresAt });
  return { accessToken, refreshToken };
}

async function signup({ email, mobile, password, role, displayName, location }) {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
  const existingMobile = await User.findOne({ mobile });
  if (existingMobile) throw new ApiError(409, "MOBILE_TAKEN", "An account with this mobile number already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  // No OTP step in this build — accounts are ACTIVE immediately (see User.js comment).
  const user = await User.create({ email, mobile, passwordHash, role, status: "ACTIVE" });
  await createInitialProfile(user._id, role, displayName, location);

  await recordAudit({ userId: user._id, action: "USER_SIGNED_UP", targetType: "User", targetId: user._id.toString() });

  const tokens = await issueTokenPair(user);
  return { user: publicUser(user), tokens };
}

async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  if (user.status === "SUSPENDED") throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account has been suspended");
  if (user.status === "REJECTED") throw new ApiError(403, "ACCOUNT_REJECTED", "This account's verification was rejected");

  user.lastLoginAt = new Date();
  await user.save();

  await recordAudit({ userId: user._id, action: "USER_LOGGED_IN", targetType: "User", targetId: user._id.toString() });
  const tokens = await issueTokenPair(user);
  return { user: publicUser(user), tokens };
}

async function refresh(refreshToken) {
  const userId = refreshToken.split(".").pop();
  if (!userId) throw new ApiError(401, "INVALID_TOKEN", "Malformed refresh token");
  const tokenHash = hashToken(refreshToken);

  const row = await RefreshToken.findOne({ userId, tokenHash, revokedAt: null });
  if (!row) throw new ApiError(401, "INVALID_TOKEN", "Refresh token not recognized");
  if (row.expiresAt.getTime() < Date.now()) {
    throw new ApiError(401, "TOKEN_EXPIRED", "Refresh token has expired, please log in again");
  }

  row.revokedAt = new Date();
  await row.save();

  const user = await User.findById(userId);
  if (!user) throw new ApiError(401, "INVALID_TOKEN", "User no longer exists");
  return issueTokenPair(user);
}

async function logout(refreshToken) {
  const userId = refreshToken.split(".").pop();
  if (!userId) return;
  await RefreshToken.updateOne(
    { userId, tokenHash: hashToken(refreshToken) },
    { $set: { revokedAt: new Date() } }
  );
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });
  // Always behave the same way whether or not the account exists, to avoid leaking registered emails.
  if (!user) return { devResetToken: undefined };
  const resetToken = jwt.sign({ sub: user._id.toString(), purpose: "password_reset" }, env.jwtRefreshSecret, {
    expiresIn: "30m",
  });
  // eslint-disable-next-line no-console
  console.log(`[DEV RESET LINK] token for ${email}: ${resetToken}`);
  return { devResetToken: env.nodeEnv === "development" ? resetToken : undefined };
}

async function resetPassword(resetToken, newPassword) {
  let payload;
  try {
    payload = jwt.verify(resetToken, env.jwtRefreshSecret);
  } catch {
    throw new ApiError(400, "INVALID_TOKEN", "Reset link is invalid or expired");
  }
  if (payload.purpose !== "password_reset") throw new ApiError(400, "INVALID_TOKEN", "Reset link is invalid");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: payload.sub }, { $set: { passwordHash } });
  await RefreshToken.updateMany({ userId: payload.sub, revokedAt: null }, { $set: { revokedAt: new Date() } });
  await recordAudit({ userId: payload.sub, action: "PASSWORD_RESET", targetType: "User", targetId: payload.sub });
}

module.exports = { signup, login, refresh, logout, forgotPassword, resetPassword, publicUser };
