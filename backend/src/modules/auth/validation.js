const { z } = require("zod");
const { PUBLIC_ROLES } = require("../../common/constants");

const signupSchema = z.object({
  email: z.string().email(),
  mobile: z.string().min(7).max(15),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(PUBLIC_ROLES),
  displayName: z.string().min(2),
  location: z.string().optional(), // required for PHARMACY, checked in the service
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  newPassword: z.string().min(8),
});

module.exports = { signupSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema };
