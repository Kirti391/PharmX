const { z } = require("zod");
const { PUBLIC_ROLES } = require("../../common/constants");

const PASSWORD_REQUIREMENTS =
  "Password must be 8–72 characters and include an uppercase letter, a lowercase letter, a number, and a special character";
const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\x21-\x7E]{8,72}$/,
    PASSWORD_REQUIREMENTS
  );

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: passwordSchema,
  role: z.enum(PUBLIC_ROLES),
  businessType: z.enum(["STOCKIST", "DISTRIBUTOR", "C_AND_F_AGENT"]).optional(),
  displayName: z.string().min(2),
  location: z.string().trim().optional(),
}).superRefine((signup, context) => {
  if (
    ["PHARMACY", "DISTRIBUTOR_STOCKIST", "DOCTOR"].includes(signup.role) &&
    !signup.location
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["location"],
      message: `${signup.role.replaceAll("_", " ")} signup requires a location`,
    });
  }
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  newPassword: passwordSchema,
});

module.exports = {
  PASSWORD_REQUIREMENTS,
  signupSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
