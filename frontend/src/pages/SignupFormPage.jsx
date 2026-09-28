import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Button, Input, Label } from "../components/ui";

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
    title: "Distributor / Stockist",
    nameLabel: "Business name",
    needsLocation: true,
    organization: true,
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
  const { role: roleSlug } = useParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const config = ROLE_MAP[roleSlug];

  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!config) {
    return (
      <main className="min-h-screen bg-[#F7F5FA] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">

          <Link to="/" className="inline-block mb-8">
            <img
              src={logo}
              alt="PharmUnis"
              className="w-[58px] h-auto mx-auto"
            />
          </Link>

          <p
            className="text-[#D83F87] text-3xl mb-2"
            style={{ fontFamily: "Great Vibes" }}
          >
            Registration
          </p>

          <h1
            className="text-[#2A1B3D] text-3xl mb-4"
            style={{ fontFamily: "Cinzel" }}
          >
            Unknown role
          </h1>

          <p
            className="text-[#A4B3B6] text-sm leading-6 mb-7"
            style={{ fontFamily: "Fauna One" }}
          >
            Please choose a professional role before creating your account.
          </p>

          <Link
            to="/signup"
            className="
              inline-flex
              items-center
              justify-center
              h-11
              px-6
              bg-[#44318D]
              text-white
              text-sm
              hover:bg-[#2A1B3D]
              transition-colors
            "
            style={{ fontFamily: "Philosopher" }}
          >
            Choose a role →
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
      });

      setSession(
        result.user,
        result.tokens.accessToken,
        result.tokens.refreshToken
      );

      navigate("/dashboard");
    } catch (err) {
      setError(apiErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5FA] text-[#2A1B3D]">

      {/* HEADER */}

      <header className="px-6 md:px-10 lg:px-16 pt-8 md:pt-10">
        <div className="max-w-[1320px] mx-auto flex items-center justify-between">

          <Link
            to="/"
            className="flex items-center gap-2.5"
          >
            <img
              src={logo}
              alt="PharmUnis"
              className="w-[42px] h-auto"
            />

            <span
              className="text-[24px] tracking-wide text-[#2A1B3D]"
              style={{ fontFamily: "Cinzel" }}
            >
              Pharm
              <span className="text-[#D83F87]">Unis</span>
            </span>
          </Link>

          <Link
            to="/login"
            className="
              text-[10px]
              uppercase
              tracking-[0.2em]
              text-[#A4B3B6]
              hover:text-[#D83F87]
              transition-colors
            "
            style={{ fontFamily: "Unica One" }}
          >
            Sign in
          </Link>

        </div>
      </header>


      {/* SIGNUP */}

      <section className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6 py-16">

        <div className="w-full max-w-[500px]">

          {/* INTRO */}

          <div className="mb-10">

            <div className="flex items-center gap-3 mb-5">

              <span className="w-8 h-[2px] bg-[#D83F87]" />

              <span
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.24em]
                  text-[#A4B3B6]
                "
                style={{ fontFamily: "Unica One" }}
              >
                Create account
              </span>

            </div>

            <h1
              className="
                text-[#2A1B3D]
                text-[34px]
                md:text-[40px]
                leading-tight
              "
              style={{ fontFamily: "Cinzel" }}
            >
              Welcome to Pharm
              <span className="text-[#D83F87]">Unis</span>
            </h1>

            <p
              className="mt-3 text-sm text-[#A4B3B6]"
              style={{ fontFamily: "Fauna One" }}
            >
              Create your professional account to get started.
            </p>

          </div>


          {/* ROLE */}

          <div
            className="
              flex
              items-center
              justify-between
              border-y
              border-[#A4B3B6]/25
              py-4
              mb-9
            "
          >

            <div>
              <span
                className="
                  block
                  text-[9px]
                  uppercase
                  tracking-[0.2em]
                  text-[#A4B3B6]
                  mb-1
                "
                style={{ fontFamily: "Unica One" }}
              >
                Registering as
              </span>

              <span
                className="text-[15px] text-[#44318D]"
                style={{ fontFamily: "Philosopher" }}
              >
                {config.title}
              </span>
            </div>

            <Link
              to="/signup"
              className="
                text-[9px]
                uppercase
                tracking-[0.18em]
                text-[#D83F87]
                hover:text-[#44318D]
                transition-colors
              "
              style={{ fontFamily: "Unica One" }}
            >
              Change
            </Link>

          </div>


          {/* FORM */}

          <form
            onSubmit={onSubmit}
            className="space-y-7"
          >

            {/* NAME */}

            <div>
              <Label
                htmlFor="signup-name"
                className="text-[#2A1B3D] text-[13px]"
                style={{ fontFamily: "Philosopher" }}
              >
                {config.nameLabel}
              </Label>

              <Input
                id="signup-name"
                name="displayName"
                type="text"
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={
                  config.organization
                    ? "Enter organization name"
                    : "Enter your full name"
                }
                className="
                  mt-2
                  h-11
                  rounded-none
                  border-0
                  border-b
                  border-[#A4B3B6]/40
                  bg-transparent
                  px-0
                  text-[#2A1B3D]
                  placeholder:text-[#A4B3B6]/60
                  shadow-none
                  focus:border-[#D83F87]
                  focus:ring-0
                "
              />
            </div>


            {/* EMAIL + MOBILE */}

            <div className="grid sm:grid-cols-2 gap-7">

              <div>
                <Label
                  htmlFor="signup-email"
                  className="text-[#2A1B3D] text-[13px]"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Email address
                </Label>

                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="
                    mt-2
                    h-11
                    rounded-none
                    border-0
                    border-b
                    border-[#A4B3B6]/40
                    bg-transparent
                    px-0
                    text-[#2A1B3D]
                    placeholder:text-[#A4B3B6]/60
                    shadow-none
                    focus:border-[#D83F87]
                    focus:ring-0
                  "
                />
              </div>

              <div>
                <Label
                  htmlFor="signup-mobile"
                  className="text-[#2A1B3D] text-[13px]"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Mobile number
                </Label>

                <Input
                  id="signup-mobile"
                  name="mobile"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="
                    mt-2
                    h-11
                    rounded-none
                    border-0
                    border-b
                    border-[#A4B3B6]/40
                    bg-transparent
                    px-0
                    text-[#2A1B3D]
                    placeholder:text-[#A4B3B6]/60
                    shadow-none
                    focus:border-[#D83F87]
                    focus:ring-0
                  "
                />
              </div>

            </div>


            {/* LOCATION */}

            {config.needsLocation && (
              <div>
                <Label
                  htmlFor="signup-location"
                  className="text-[#2A1B3D] text-[13px]"
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
                  placeholder="City, state"
                  className="
                    mt-2
                    h-11
                    rounded-none
                    border-0
                    border-b
                    border-[#A4B3B6]/40
                    bg-transparent
                    px-0
                    text-[#2A1B3D]
                    placeholder:text-[#A4B3B6]/60
                    shadow-none
                    focus:border-[#D83F87]
                    focus:ring-0
                  "
                />
              </div>
            )}


            {/* PASSWORD */}

            <div>
              <Label
                htmlFor="signup-password"
                className="text-[#2A1B3D] text-[13px]"
                style={{ fontFamily: "Philosopher" }}
              >
                Password
              </Label>

              <Input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="
                  mt-2
                  h-11
                  rounded-none
                  border-0
                  border-b
                  border-[#A4B3B6]/40
                  bg-transparent
                  px-0
                  text-[#2A1B3D]
                  placeholder:text-[#A4B3B6]/60
                  shadow-none
                  focus:border-[#D83F87]
                  focus:ring-0
                "
              />

              <p
                className="mt-2 text-[10px] text-[#A4B3B6]"
                style={{ fontFamily: "Fauna One" }}
              >
                Minimum 8 characters.
              </p>
            </div>


            {/* ERROR */}

            {error && (
              <div className="flex items-start gap-3 pt-1">

                <span className="mt-1 w-1.5 h-1.5 shrink-0 rounded-full bg-[#D83F87]" />

                <p
                  className="text-xs text-[#D83F87] leading-5"
                  style={{ fontFamily: "Fauna One" }}
                >
                  {error}
                </p>

              </div>
            )}


            {/* CREATE */}

            <div className="pt-3">

              <Button
                type="submit"
                loading={loading}
                className="
                  group
                  w-full
                  h-12
                  rounded-none
                  bg-[#44318D]
                  hover:bg-[#2A1B3D]
                  text-white
                  border-0
                  shadow-none
                  transition-colors
                  duration-200
                "
              >
                <span
                  className="flex items-center justify-center gap-3"
                  style={{ fontFamily: "Philosopher" }}
                >
                  Create account

                  <span
                    className="
                      text-[#E98074]
                      transition-transform
                      duration-200
                      group-hover:translate-x-1
                    "
                  >
                    →
                  </span>
                </span>
              </Button>

            </div>

          </form>


          {/* SIGN IN */}

          <div className="mt-8 text-center">

            <p
              className="text-xs text-[#A4B3B6]"
              style={{ fontFamily: "Fauna One" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="
                  text-[#D83F87]
                  hover:text-[#44318D]
                  transition-colors
                "
              >
                Sign in
              </Link>
            </p>

          </div>


          {/* SMALL BRAND MARK */}

          <div className="flex justify-center items-center gap-1.5 mt-10">

            <span className="w-7 h-[2px] bg-[#D83F87]" />
            <span className="w-5 h-[2px] bg-[#44318D]" />
            <span className="w-3 h-[2px] bg-[#E98074]" />

          </div>

        </div>

      </section>

    </main>
  );
}