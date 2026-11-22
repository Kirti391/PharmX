const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../src/modules/auth/validation");

const signup = {
  email: "User@Example.com",
  mobile: "9876543210",
  password: "PharmUnis!2026",
  role: "MR",
  displayName: "Test User",
  location: "Pune",
};

describe("authentication validation", () => {
  it("normalizes email casing and surrounding whitespace", () => {
    assert.equal(signupSchema.parse(signup).email, "user@example.com");
    assert.equal(loginSchema.parse({
      email: " USER@Example.com ",
      password: "legacy-password",
    }).email, "user@example.com");
    assert.equal(
      forgotPasswordSchema.parse({ email: " USER@Example.com " }).email,
      "user@example.com"
    );
  });

  it("accepts only valid 10-digit Indian mobile numbers", () => {
    for (const mobile of ["9876543210", "6123456789"]) {
      assert.equal(signupSchema.safeParse({ ...signup, mobile }).success, true);
    }

    for (const mobile of [
      "987654321",
      "98765432101",
      "5876543210",
      "98765abc10",
      "+919876543210",
    ]) {
      assert.equal(signupSchema.safeParse({ ...signup, mobile }).success, false);
    }
  });

  it("requires uppercase, lowercase, number, and special characters", () => {
    for (const password of [
      "alllowercase1!",
      "ALLUPPERCASE1!",
      "NoNumber!!",
      "NoSpecial123",
    ]) {
      assert.equal(signupSchema.safeParse({ ...signup, password }).success, false);
      assert.equal(
        resetPasswordSchema.safeParse({
          resetToken: "a-valid-reset-token",
          newPassword: password,
        }).success,
        false
      );
    }

    assert.equal(signupSchema.safeParse(signup).success, true);
    assert.equal(
      resetPasswordSchema.safeParse({
        resetToken: "a-valid-reset-token",
        newPassword: "PharmUnis!2026",
      }).success,
      true
    );
  });

  it("rejects passwords outside the bcrypt-safe length and allowed characters", () => {
    for (const password of ["Ab1!sho", `Aa1!${"x".repeat(69)}`, "Aa1!with space"]) {
      assert.equal(signupSchema.safeParse({ ...signup, password }).success, false);
    }

    assert.equal(
      signupSchema.safeParse({ ...signup, password: "Aa1!abcd" }).success,
      true
    );
    assert.equal(
      signupSchema.safeParse({ ...signup, password: `Aa1!${"x".repeat(68)}` }).success,
      true
    );
  });
});
