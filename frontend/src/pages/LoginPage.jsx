import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Label } from "../components/ui";

import logo from "../assets/pharmunis logo.png";

export default function LoginPage({ adminPortal = false }) {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await http.post("/auth/login", {
        email,
        password,
      });

      if (adminPortal && result.user.role !== "ADMIN") {
        await http.post("/auth/logout", {
          refreshToken: result.tokens.refreshToken,
        });
        throw new Error("This portal is for provisioned administrator accounts only.");
      }

      setSession(
        result.user,
        result.tokens.accessToken,
        result.tokens.refreshToken
      );

      // Login works for every role.
      // Admins have a separate dashboard;
      // all other authenticated roles use the main dashboard.
      navigate(
        result.user.role === "ADMIN"
          ? "/admin/dashboard"
          : "/dashboard"
      );
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5FA] flex items-center justify-center px-5 py-10">

      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex justify-center mb-11">
          <Link to="/">
            <img
              src={logo}
              alt="PharmUnis"
              className="w-[95px] h-auto"
            />
          </Link>
        </div>

        {/* Heading */}
        <div className="text-center mb-9">
          <p
            className="text-[#D83F87] text-[11px] uppercase tracking-[0.28em] mb-3"
            style={{ fontFamily: "Fauna One" }}
          >
            {adminPortal ? "Administration" : "Welcome back"}
          </p>

          <h1
            className="text-[#2A1B3D] text-[36px] leading-tight"
            style={{ fontFamily: "Cinzel" }}
          >
            {adminPortal ? "Administrator sign in" : "Sign in"}
          </h1>

          <p
            className="mt-3 text-[#A4B3B6] text-sm"
            style={{ fontFamily: "Fauna One" }}
          >
            {adminPortal
              ? "Sign in with an administrator account provisioned by PharmUnis."
              : "Access your professional workspace"}
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={onSubmit} className="space-y-6">

          {/* Email */}
          <Label
  htmlFor="login-email"
  className="text-[#2A1B3D] text-sm"
  style={{ fontFamily: "Philosopher" }}
>
  Email
</Label>

<Input
  id="login-email"
  name="email"
  type="email"
  required
  autoComplete="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="you@company.com"
  className="mt-2 h-12 rounded-xl border-[#A4B3B6]/50 bg-white text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-1 focus:ring-[#D83F87]/20"
/>
          {/* Password */}
         <Label
  htmlFor="login-password"
  className="text-[#2A1B3D] text-sm"
  style={{ fontFamily: "Philosopher" }}
>
  Password
</Label>

<Input
  id="login-password"
  name="password"
  type="password"
  required
  autoComplete="current-password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="••••••••"
  className="mt-2 h-12 rounded-xl border-[#A4B3B6]/50 bg-white text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-1 focus:ring-[#D83F87]/20"
/>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-[#D83F87]/8 border border-[#D83F87]/20 px-4 py-3">
              <p className="text-sm text-[#D83F87]">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            loading={loading}
            className="
              w-full
              h-12
              rounded-xl
              bg-[#2A1B3D]
              hover:bg-[#44318D]
              text-white
              border-0
              shadow-none
              transition-colors
              duration-200
            "
          >
            <span style={{ fontFamily: "Philosopher" }}>
              Sign in
            </span>
          </Button>
        </form>

        {/* Signup */}
        {!adminPortal && <div className="text-center mt-8">
          <p
            className="text-sm text-[#A4B3B6]"
            style={{ fontFamily: "Fauna One" }}
          >
            New to PharmUnis?{" "}
            <Link
              to="/signup"
              className="
                text-[#D83F87]
                hover:text-[#44318D]
                transition-colors
              "
            >
              Create an account
            </Link>
          </p>
        </div>}

        <div className="mt-5 text-center">
          {adminPortal ? (
            <Link
              to="/login"
              className="text-sm text-[#44318D] hover:text-[#D83F87]"
              style={{ fontFamily: "Fauna One" }}
            >
              Return to professional sign in
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="text-xs text-[#A4B3B6] hover:text-[#D83F87]"
              style={{ fontFamily: "Fauna One" }}
            >
              Administrator sign in
            </Link>
          )}
        </div>

        {/* Minimal palette detail */}
        <div className="flex justify-center items-center gap-1.5 mt-10">
          <span className="w-5 h-[2px] bg-[#D83F87]" />
          <span className="w-5 h-[2px] bg-[#44318D]" />
          <span className="w-5 h-[2px] bg-[#E98074]" />
          <span className="w-5 h-[2px] bg-[#A4B3B6]" />
        </div>

      </div>
    </main>
  );
}