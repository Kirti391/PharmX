const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

function signAccessToken(userId, role) {
  return jwt.sign({ sub: userId.toString(), role }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

function signRefreshToken(userId) {
  // Opaque random string + userId suffix, not a JWT — the DB row (hashed) is the source
  // of truth, which is what lets us revoke individual sessions server-side.
  return crypto.randomBytes(48).toString("hex") + "." + userId.toString();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { signAccessToken, signRefreshToken, hashToken };
