import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Label, Select } from "../components/ui";

import logo from "../assets/pharmunis logo.png";

const ROLE_MAP = {
  "pharma-company": {
    role: "PHARMA_COMPANY",
    title: "Pharmaceutical Company",
    nameLabel: "Company name",
    needsLocation: true,
    organization: true,
  },
  mr: {
    role: "MR",
    title: "Medical Representative / Executive",
    nameLabel: "Full name",
    needsLocation: true,
    organization: false,
  },
  pharmacy: {
    role: "PHARMACY",
    title: "Pharmacy / Chemist",
    nameLabel: "Pharmacy name",
    needsLocation: true,
    organization: true,
  },
  "distributor-stockist": {
    role: "DISTRIBUTOR_STOCKIST",
    title: "Distributor / Stockist / C&F Agent",
    nameLabel: "Business name",
    needsLocation: true,
    organization: true,
    needsBusinessType: true,
  },
  doctor: {
    role: "DOCTOR",
    title: "Doctor / Registered Medical Practitioner",
    nameLabel: "Full name",
    needsLocation: true,
    organization: false,
  },
};

export default function SignupFormPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const config = ROLE_MAP[role];

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("STOCKIST");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!config) {
    return (
      <main className="min-h-screen bg-[#F7F5FA] flex items-center justify-center px-6">
        <div className="text-center">
          <h1
            className="text-3xl text-[#2A1B3D]"
            style={{ fontFamily: "Cinzel" }}
          >
            Role not found
          </h1>

          <Link
            to="/signup"
            className="inline-block mt-5 text-sm text-[#D83F87] hover:text-[#44318D]"
            style={{ fontFamily: "Fauna One" }}
          >
            Choose another role
          </Link>
        </div>
      </main>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await http.post("/auth/signup", {
        email,
        mobile,
        password,
        role: config.role,
        displayName,
        location: config.needsLocation ? location : undefined,
        businessType: config.needsBusinessType ? businessType : undefined,
      });

      setSession(
        result.user,
        result.tokens.accessToken,
        result.tokens.refreshToken
      );

      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to create account"));
    } finally {
      setLoading(false);
    }
  }

  return (
   <main className="min-h-screen bg-[#F7F5FA] lg:h-screen lg:overflow-hidden lg:grid lg:grid-cols-[1fr_0.9fr]">

      {/* =====================================================
          LEFT — SIGNUP
      ====================================================== */}
      <section className="h-screen flex flex-col bg-[#F7F5FA]">

        {/* Header */}
        <header className="flex items-center justify-between px-7 sm:px-10 lg:px-12 py-6 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logo}
              alt="PharmUnis"
              className="w-[38px] h-auto"
            />

            <span
              className="text-[20px] tracking-wide text-[#2A1B3D]"
              style={{ fontFamily: "Cinzel" }}
            >
              Pharm
              <span className="text-[#D83F87]">Unis</span>
            </span>
          </Link>

          <Link
            to="/login"
            className="text-xs text-[#44318D] hover:text-[#D83F87] transition-colors"
            style={{ fontFamily: "Fauna One" }}
          >
            Sign in
          </Link>
        </header>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-7 sm:px-10 lg:px-12 xl:px-20">
          <div className="w-full max-w-[470px]">

            {/* Heading */}
            <div className="mb-5 text-center">
              <p
                className="text-[#D83F87] text-[26px] leading-none mb-1"
                style={{ fontFamily: "Great Vibes" }}
              >
                Welcome
              </p>

              <h3
                className="text-[#2A1B3D] text-[34px] sm:text-[30px] leading-tight"
                style={{ fontFamily: "Cinzel" }}
              >
                Create your account
              </h3>

              <p
                className="mt-2 text-xs text-[#44318D]/70"
                style={{ fontFamily: "Fauna One" }}
              >
                Set up your professional profile on PharmUnis.
              </p>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between border-y border-[#A4B3B6]/35 py-3 mb-5">
              <div>
                <p
                  className="text-[8px] uppercase tracking-[0.2em] text-[#A4B3B6]"
                  style={{ fontFamily: "Unica One" }}
                >
                  Registering as
                </p>

                <p
                  className="mt-0.5 text-[15px] text-[#2A1B3D]"
                  style={{ fontFamily: "Philosopher" }}
                >
                  {config.title}
                </p>
              </div>

              <Link
                to="/signup"
                className="text-[11px] text-[#D83F87] hover:text-[#44318D]"
                style={{ fontFamily: "Fauna One" }}
              >
                Change
              </Link>
            </div>

            {/* Fields */}
            <form onSubmit={onSubmit} className="space-y-3">

              {/* Name */}
              <div>
                <Label
                  htmlFor="signup-display-name"
                  className="text-[#2A1B3D] text-xs"
                  style={{ fontFamily: "Philosopher" }}
                >
                  {config.nameLabel}
                </Label>

                <Input
                  id="signup-display-name"
                  name="displayName"
                  type="text"
                  required
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={
                    config.organization
                      ? "Enter name"
                      : "Enter your full name"
                  }
                  className="mt-0.5 h-9 rounded-none border-0 border-b border-[#A4B3B6]/50 bg-transparent px-0 text-sm text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-0"
                />
              </div>

              {/* Email */}
              <div>
                <Label
                  htmlFor="signup-email"
                  className="text-[#2A1B3D] text-xs"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Email
                </Label>

                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-0.5 h-9 rounded-none border-0 border-b border-[#A4B3B6]/50 bg-transparent px-0 text-sm text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-0"
                />
              </div>

              {/* Mobile */}
              <div>
                <Label
                  htmlFor="signup-mobile"
                  className="text-[#2A1B3D] text-xs"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Mobile
                </Label>

                <Input
                  id="signup-mobile"
                  name="mobile"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                  className="mt-0.5 h-9 rounded-none border-0 border-b border-[#A4B3B6]/50 bg-transparent px-0 text-sm text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-0"
                />
              </div>

              {/* Password */}
              <div>
                <Label
                  htmlFor="signup-password"
                  className="text-[#2A1B3D] text-xs"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Password
                </Label>

                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="mt-0.5 h-9 rounded-none border-0 border-b border-[#A4B3B6]/50 bg-transparent px-0 text-sm text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-0"
                />
              </div>

              {/* Location */}
              {config.needsBusinessType && (
                <div className="mb-4">
                  <Label
                    htmlFor="signup-business-type"
                    className="text-[#2A1B3D] text-xs"
                    style={{ fontFamily: "Philosopher" }}
                  >
                    Business type
                  </Label>
                  <Select
                    id="signup-business-type"
                    value={businessType}
                    onChange={(event) => setBusinessType(event.target.value)}
                    className="mt-0.5 h-9 rounded-none border-0 border-b border-[#A4B3B6]/50 bg-transparent px-0 text-sm text-[#2A1B3D] shadow-none focus:border-[#D83F87] focus:ring-0"
                  >
                    <option value="STOCKIST">Stockist</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="C_AND_F_AGENT">Clearing &amp; forwarding agent</option>
                  </Select>
                </div>
              )}

              {/* Location */}
              {config.needsLocation && (
                <div>
                  <Label
                    htmlFor="signup-location"
                    className="text-[#2A1B3D] text-xs"
                    style={{ fontFamily: "Philosopher" }}
                  >
                    Location
                  </Label>

                  <Input
                    id="signup-location"
                    name="location"
                    type="text"
                    required
                    autoComplete="address-level2"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City / area"
                    className="mt-0.5 h-9 rounded-none border-0 border-b border-[#A4B3B6]/50 bg-transparent px-0 text-sm text-[#2A1B3D] placeholder:text-[#A4B3B6] shadow-none focus:border-[#D83F87] focus:ring-0"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="border-l-2 border-[#D83F87] bg-[#D83F87]/5 px-3 py-2">
                  <p
                    className="text-xs text-[#D83F87]"
                    style={{ fontFamily: "Fauna One" }}
                  >
                    {error}
                  </p>
                </div>
              )}

              {/* Button */}
              <Button
                type="submit"
                loading={loading}
                className="w-full h-10 mt-1 rounded-none bg-[#2A1B3D] hover:bg-[#44318D] text-white border-0 shadow-none transition-colors"
              >
                <span
                  className="text-sm"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Create account
                </span>
              </Button>
            </form>

            {/* Footer */}
            <p
              className="text-center text-[11px] text-[#A4B3B6] mt-4"
              style={{ fontFamily: "Fauna One" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#D83F87] hover:text-[#44318D] "
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          RIGHT — DECORATIVE
      ====================================================== */}
      <section className="relative hidden lg:block h-screen overflow-hidden bg-[#2A1B3D]">

        {/* Purple circle */}
        <div
          className="
            absolute
            w-[500px]
            h-[500px]
            rounded-full
            bg-[#44318D]
            -right-[180px]
            -top-[80px]
          "
        />

        {/* Pink vertical shape */}
        <div
          className="
            absolute
            w-[190px]
            h-[390px]
            rounded-[100px]
            bg-[#D83F87]
            right-[7%]
            top-[32%]
            rotate-[17deg]
          "
        />

        {/* Coral accent */}
        <div
          className="
            absolute
            w-[105px]
            h-[210px]
            rounded-[70px]
            bg-[#E98074]
            right-[35%]
            bottom-[14%]
            rotate-[-22deg]
          "
        />

        {/* Fine circle */}
        <div
          className="
            absolute
            w-[300px]
            h-[300px]
            rounded-full
            border
            border-[#F7F5FA]/20
            right-[22%]
            top-[25%]
          "
        />

        {/* Vertical line */}
        <div className="absolute left-[13%] top-[12%] bottom-[12%] w-px bg-[#F7F5FA]/15" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-10 xl:p-14">

          <span
            className="text-[9px] uppercase tracking-[0.25em] text-[#F7F5FA]/80"
            style={{ fontFamily: "Unica One" }}
          >
            PHARMUNIS
          </span>

          <div className="max-w-[320px]">
            <p
              className="text-[#E98074] text-[27px] mb-2"
              style={{ fontFamily: "Great Vibes" }}
            >
              Welcome to the network
            </p>

            <h2
              className="text-[#F7F5FA] text-[44px] xl:text-[50px] leading-[0.98]"
              style={{ fontFamily: "Cinzel" }}
            >
              Your
              <br />
              professional
              <br />
              <span className="text-[#D83F87]">space.</span>
            </h2>

            <div className="w-10 h-[2px] bg-[#E98074] mt-6" />

            <p
              className="mt-5 text-sm leading-6 text-[#F7F5FA]/90"
              style={{ fontFamily: "Fauna One" }}
            >
              A professional network connecting the pharmaceutical
              ecosystem.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span
              className="text-[9px] uppercase tracking-[0.16em] text-[#F7F5FA]/70"
              style={{ fontFamily: "Unica One" }}
            >
              Professional · Verified · Connected
            </span>

            <div className="flex gap-1.5">
              <span className="w-5 h-[2px] bg-[#D83F87]" />
              <span className="w-5 h-[2px] bg-[#E98074]" />
              <span className="w-5 h-[2px] bg-[#A4B3B6]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}