require("dotenv").config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/pharmx",
  // Comma-separated list so multiple frontend origins (prod + preview deploys) can be allowed.
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtAccessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  accessTokenTtl: "15m",
  refreshTokenTtlDays: 7,
  uploadDir: process.env.UPLOAD_DIR || null, // null => defaults to local ./uploads
  publicUrl: process.env.PUBLIC_URL || null,
};

module.exports = env;
