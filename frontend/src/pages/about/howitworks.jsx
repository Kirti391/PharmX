import React, { useState } from "react";

const workflows = [
  {
    title: "Pharmacy Requirement",
    description:
      "Find the right pharmaceutical connection for your requirement.",
    steps: [
      "Register",
      "Verify",
      "Post need",
      "Review matches",
      "Connect",
      "Appointment",
    ],
  },
  {
    title: "Company Expansion",
    description:
      "Expand your reach by connecting with verified MRs and distributors.",
    steps: [
      "Verify company",
      "Publish opportunity",
      "Find MR / distributor",
      "Assign relationship",
    ],
  },
  {
    title: "MR Opportunity",
    description:
      "Build your professional profile and discover relevant opportunities.",
    steps: [
      "Verify identity",
      "Build profile",
      "Find opportunities",
      "Apply",
      "Get authorized",
    ],
  },
  {
    title: "Distributor Partnership",
    description:
      "Connect with pharmacies and companies within your service area.",
    steps: [
      "Verify licence",
      "Add service area",
      "Find pharmacy / company",
      "Respond",
    ],
  },
  {
    title: "Doctor Communication",
    description:
      "Connect with verified opportunities while keeping communication purposeful.",
    steps: [
      "Verify registration",
      "Opt in",
      "Review purpose",
      "Accept or decline request",
    ],
  },
];

const HowItWorks = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  return (
    <section
      id="how-it-works"
      className="
        relative
        min-h-screen
        bg-[#F7F5FA]
        text-[#2A1B3D]
        px-4
        sm:px-6
        md:px-12
        lg:px-20
        pt-20
        pb-20
        md:pt-28
        md:pb-32
      "
    >
      {/* =========================
          OVERLAPPING TITLE
      ========================== */}
      <div
        className="
          absolute
          top-0
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          z-20
          w-full
          overflow-hidden
          text-center
          pointer-events-none
        "
      >
        <h2
          className="
            font-['Great_Vibes']
            text-5xl
            sm:text-6xl
            md:text-7xl
            lg:text-8xl
            leading-none
            font-normal
            text-[#E98074]
            whitespace-nowrap
          "
        >
          How It Works
        </h2>
      </div>

      {/* =========================
          SECTION INTRO
      ========================== */}
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
        <p
          className="
            font-[Fauna_One]
            text-[#D83F87]
            text-sm
            tracking-[3px]
            uppercase
            mb-4
          "
        >
          Simple & Structured
        </p>

        <p
          className="
            mt-5
            font-[Fauna_One]
            text-sm
            sm:text-base
            md:text-lg
            text-gray-600
            leading-7
            md:leading-8
          "
        >
          A simple, verified workflow designed for every role
          across the pharmaceutical ecosystem.
        </p>
      </div>

      {/* =========================
          WORKFLOW CARDS
      ========================== */}
      <div className="max-w-5xl mx-auto">
        <div
          className="
            w-full
            rounded-2xl
            bg-[#A4B3B6]
            p-2
            flex
            flex-col
            md:flex-row
            gap-2
            shadow-lg
          "
        >
          {workflows.map((workflow, index) => {
            const isActive = activeIndex === index;

            return (
              <div
                key={workflow.title}
                onClick={() => setActiveIndex(isActive ? null : index)}
                className={`
                  group
                  relative
                  w-full
                  rounded-xl
                  bg-[#f5ebeb]
                  border border-[#D83F87]/50
                  overflow-hidden
                  cursor-pointer
                  transition-all
                  duration-500
                  ease-in-out

                  ${
                   isActive
  ? "h-[390px] sm:h-[360px] bg-[#44318D]"
  : "h-[145px] sm:h-[155px] bg-[#f5ebeb]"
                  }
                 

                  md:h-[360px]
                  md:flex-1
                  md:min-w-0
                  md:hover:flex-[4]
                  md:hover:bg-[#44318D]
                `}
              >
                {/* =========================
                    COLLAPSED CONTENT
                ========================== */}
                <div
                  className={`
                    absolute
                    inset-0
                    flex
                    flex-row
                    md:flex-col
                    items-center
                    justify-center
                    gap-4
                    md:gap-5
                    p-5

                    transition-all
                    duration-500

                    ${
                      isActive
                        ? "opacity-0 scale-90"
                        : "opacity-100 scale-100"
                    }

                    md:opacity-100
                    md:scale-100
                    md:group-hover:opacity-0
                    md:group-hover:scale-90
                  `}
                >
                  <span
                    className="
                      font-['Unica_One']
                      text-base
                      md:text-sm
                      font-semibold
                      tracking-[2px]
                      text-[#D83F87]
                    "
                  >
                    0{index + 1}
                  </span>

                  <span
                    className="
                      font-['Unica_One']
                      uppercase
                      tracking-[1.5px]
                      text-[#2A1B3D]
                      text-xs
                      font-semibold
                      text-center
                      leading-5
                      md:[writing-mode:vertical-rl]
                      md:rotate-180
                    "
                  >
                    {workflow.title}
                  </span>
                </div>

                {/* =========================
                    EXPANDED CONTENT
                ========================== */}
                <div
                  className={`
                    absolute
                    inset-0
                    flex
                    flex-col
                    justify-center
                    p-5
                    sm:p-7
                    md:p-8

                    transition-all
                    duration-500

                    ${
                      isActive
                        ? "opacity-100 scale-100  bg-[#44318D]"
                        : "opacity-0 scale-95 pointer-events-none"
                    }

                    md:opacity-0
                    md:scale-95
                    md:pointer-events-none

                    md:group-hover:opacity-100
                    md:group-hover:scale-100
                    md:group-hover:pointer-events-auto
                  `}
                >
                  <span
                    className="
                      font-['Unica_One']
                      text-xs
                      tracking-[3px]
                      text-[#D83F87]
                      mb-2
                    "
                  >
                    0{index + 1}
                  </span>

                  <h3
                    className="
                      font-['Philosopher']
                      text-xl
                      sm:text-2xl
                      md:text-3xl
                      font-bold
                      text-white/90
                      leading-tight
                      mb-3
                    "
                  >
                    {workflow.title}
                  </h3>

                  <p
                    className="
                      font-[Fauna_One]
                      text-xs
                      sm:text-sm
                      md:text-base
                      leading-6
                      md:leading-7
                      text-[#b8bfc1]
                      max-w-xl
                      mb-4
                    "
                  >
                    {workflow.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {workflow.steps.map((step, stepIndex) => (
                      <div
                        key={step}
                        className="
                          flex
                          items-center
                          gap-2
                          bg-[#F7F5FA]
                          border
                          border-[#2A1B3D]/15
                          rounded-lg
                          px-2.5
                          py-1.5
                          font-[Fauna_One]
                          text-[10px]
                          md:text-xs
                          text-[#2A1B3D]
                        "
                      >
                        <span
                          className="
                            w-5
                            h-5
                            shrink-0
                            rounded-md
                            bg-[#D83F87]
                            text-white
                            flex
                            items-center
                            justify-center
                            text-[9px]
                            font-bold
                          "
                        >
                          {stepIndex + 1}
                        </span>

                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;