const express = require("express");
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

const router = express.Router();

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
    if (parsed.success) await authService.logout(parsed.data.refreshToken);
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
