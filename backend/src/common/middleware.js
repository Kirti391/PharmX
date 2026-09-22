const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { ApiError, fail } = require("./http");

/** Wraps an async route handler so thrown/rejected errors reach the global error handler. */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, 401, "UNAUTHENTICATED", "Missing or malformed Authorization header");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    req.user = payload; // { sub, role }
    next();
  } catch {
    return fail(res, 401, "INVALID_TOKEN", "Access token is invalid or expired");
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, "UNAUTHENTICATED", "Not authenticated");
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, "FORBIDDEN_ROLE", `This action requires one of: ${roles.join(", ")}`);
    }
    next();
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return fail(res, err.status, err.code, err.message);
  }
  if (err.name === "ValidationError") {
    // Mongoose schema validation error
    return fail(res, 400, "VALIDATION_ERROR", err.message);
  }
  if (err.code === 11000) {
    // Mongo duplicate-key error — same pattern you already used in the auth route
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return fail(res, 409, "DUPLICATE", `${field} already in use`);
  }
  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);
  return fail(res, 500, "INTERNAL_ERROR", "Something went wrong");
}

module.exports = { asyncHandler, requireAuth, requireRole, errorHandler };
