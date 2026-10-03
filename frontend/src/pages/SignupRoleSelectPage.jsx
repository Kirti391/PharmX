import { Link } from "react-router-dom";
import logo from "../assets/pharmunis logo.png";

const ROLES = [
  {
    slug: "pharma-company",
    number: "01",
    title: "Pharmaceutical Company",
  },
  {
    slug: "mr",
    number: "02",
    title: "Medical Representatives / Executives",
  },
  {
    slug: "pharmacy",
    number: "03",
    title: "Pharmacy / Chemist",
  },
  {
    slug: "distributor-stockist",
    number: "04",
    title: "Distributor / Stockist",
  },
  {
    slug: "doctor",
    number: "05",
    title: "Doctor / Registered Medical Practitioner",
  },
];

export default function SignupRoleSelectPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#2A1B3D]  to-[#44318D] text-white">
      <div className="min-h-screen max-w-[1320px] mx-auto px-6 md:px-10 lg:px-16">

        {/* Content */}
        <section className="grid lg:grid-cols-[0.85fr_1.15fr] gap-14 lg:gap-24 pt-20 md:pt-28 pb-16">

          {/* Left */}
          <div>
            <div className="flex items-center justify-between pb-[70px] -mt-10 md:-mt-14">

              {/* Brand */}
              <Link
                to="/"
                className="flex items-center gap-2.5"
              >
                <img
                  src={logo}
                  alt="PharmUnis"
                  className="w-[45px] h-auto"
                />

                <span
                  className="text-[25px] tracking-wide text-white"
                  style={{ fontFamily: "Cinzel" }}
                >
                  Pharm
                  <span className="text-[#D83F87]">Unis</span>
                </span>
              </Link>
            </div>

            <p
              className="
                text-[#D83F87]
                text-3xl
                md:text-4xl
                mb-4
              "
              style={{ fontFamily: "Great Vibes" }}
            >
              Welcome
            </p>

            <h1
              className="
                text-5xl
                md:text-6xl
                xl:text-[68px]
                leading-[0.95]
                text-[#F7F5FA]
              "
              style={{ fontFamily: "Cinzel" }}
            >
              Choose your
              <br />
              professional
              <br />
              <span className="text-[#D83F87]">
                role.
              </span>
            </h1>

            <p
              className="
                mt-8
                max-w-[350px]
                text-sm
                leading-7
                text-[#A4B3B6]
              "
              style={{ fontFamily: "Fauna One" }}
            >
              Select the role that best represents your
              professional identity on PharmUnis.
            </p>

            {/* Login */}
            <div
              className="
                flex items-center gap-2
                text-xs
                text-[#A4B3B6]
                mt-10
              "
              style={{ fontFamily: "Fauna One" }}
            >
              <span className="hidden sm:block">
                Already have an account?
              </span>

              <Link
                to="/login"
                className="
                  text-[#D83F87]
                  hover:text-white
                  transition-colors
                "
              >
                Sign in
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                to="/admin/login"
                className="text-[#A4B3B6] hover:text-white transition-colors"
              >
                Administrator sign in
              </Link>
            </div>
          </div>

          {/* Right */}
          <div>

            {/* Role Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.22em]
                  text-[#A4B3B6]/60
                "
                style={{ fontFamily: "Unica One" }}
              >
                Select your role
              </span>

              <span
                className="
                  text-[10px]
                  uppercase
                  tracking-[0.22em]
                  text-[#A4B3B6]/40
                "
                style={{ fontFamily: "Unica One" }}
              >
                05 options
              </span>
            </div>

            {/* Roles */}
            <div>
              {ROLES.map((role) => (
                <Link
                  key={role.slug}
                  to={`/signup/${role.slug}`}
                  className="
                    group
                    flex
                    items-center
                    gap-5
                    md:gap-7
                    min-h-[105px]
                    border-b
                    border-white/10
                    transition-all
                    duration-300
                    hover:bg-white/[0.035]
                    hover:pl-3
                  "
                >

                  {/* Number */}
                  <span
                    className="
                      w-7
                      shrink-0
                      text-[11px]
                      tracking-[0.12em]
                      text-[#A4B3B6]/50
                      group-hover:text-[#D83F87]
                      transition-colors
                    "
                    style={{ fontFamily: "Unica One" }}
                  >
                    {role.number}
                  </span>

                  {/* Role */}
                  <h2
                    className="
                      flex-1
                      text-xl
                      md:text-2xl
                      lg:text-[27px]
                      leading-tight
                      text-[#F7F5FA]/80
                      group-hover:text-white
                      transition-colors
                    "
                    style={{ fontFamily: "Philosopher" }}
                  >
                    {role.title}
                  </h2>

                  {/* Arrow */}
                  <span
                    className="
                      text-lg
                      text-[#A4B3B6]/30
                      group-hover:text-[#D83F87]
                      group-hover:translate-x-1
                      transition-all
                    "
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>

            {/* Note */}
            <p
              className="
                mt-7
                text-[11px]
                leading-5
                text-[#A4B3B6]/50
              "
              style={{ fontFamily: "Fauna One" }}
            >
              You can complete your professional details and
              verification information after creating your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}