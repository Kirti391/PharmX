const express = require("express");
const rateLimit = require("express-rate-limit");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ok, created, fail } = require("../../common/http");
const {
  signupSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./validation");
const authService = require("./service");
const User = require("../../models/User");
const { recordAudit } = require("../../common/audit");

const router = express.Router();
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    fail(
      res,
      429,
      "ADMIN_LOGIN_RATE_LIMITED",
      "Too many administrator sign-in attempts. Try again in 15 minutes."
    ),
});

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const result = await authService.signup(parsed.data);
    created(res, result);
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Email and password are required");
    const result = await authService.login(parsed.data.email, parsed.data.password);
    ok(res, result);
  })
);

router.post(
  "/admin/login",
  adminLoginLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(res, 400, "VALIDATION_ERROR", "Email and password are required");
    }
    let result;
    try {
      result = await authService.login(parsed.data.email, parsed.data.password);
    } catch (error) {
      if (error.status === 401) {
        await recordAudit({
          action: "ADMIN_LOGIN_FAILED",
          targetType: "AdminLogin",
          targetId: "ADMIN_LOGIN",
          ipAddress: req.ip,
        });
      }
      throw error;
    }
    if (result.user.role !== "ADMIN") {
      await authService.logout(result.tokens.refreshToken);
      return fail(
        res,
        403,
        "ADMIN_ACCOUNT_REQUIRED",
        "This portal is for administrator accounts only"
      );
    }
    await recordAudit({
      userId: result.user.id,
      action: "ADMIN_LOGIN_SUCCESS",
      targetType: "AdminLogin",
      targetId: result.user.id.toString(),
      ipAddress: req.ip,
    });
    ok(res, result);
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "refreshToken is required");
    const tokens = await authService.refresh(parsed.data.refreshToken);
    ok(res, { tokens });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (parsed.success) {
      const revoked = await authService.logout(parsed.data.refreshToken);
      if (revoked) {
        const userId = parsed.data.refreshToken.split(".").pop();
        const user = await User.findById(userId).select("role");
        if (user?.role === "ADMIN") {
          await recordAudit({
            userId: user._id,
            action: "ADMIN_LOGOUT",
            targetType: "AdminLogin",
            targetId: user._id.toString(),
            ipAddress: req.ip,
          });
        }
      }
    }
    ok(res, { done: true });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "Valid email is required");
    ok(res, await authService.forgotPassword(parsed.data.email));
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", "resetToken and newPassword are required");
    await authService.resetPassword(parsed.data.resetToken, parsed.data.newPassword);
    ok(res, { done: true });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.sub);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
    ok(res, authService.publicUser(user));
  })
);

module.exports = router;
