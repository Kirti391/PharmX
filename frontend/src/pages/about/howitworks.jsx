import React from "react";

const workflows = [
  {
    title: "Pharmacy Requirement",
    description: "Find the right pharmaceutical connection for your requirement.",
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
    description: "Expand your reach by connecting with verified MRs and distributors.",
    steps: [
      "Verify company",
      "Publish opportunity",
      "Find MR / distributor",
      "Assign relationship",
    ],
  },
  {
    title: "MR Opportunity",
    description: "Build your professional profile and discover relevant opportunities.",
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
    description: "Connect with pharmacies and companies within your service area.",
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
  return (
    <section
      id="how-it-works"
      className="
        relative
        min-h-screen
        bg-[#F7F5FA]
        text-[#2A1B3D]
        px-6
        md:px-12
        lg:px-20
        pt-28
        pb-50
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
          text-center
          pointer-events-none
        "
      >
        <h2
          className="
            font-['Great_Vibes']
            text-6xl
            md:text-7xl
            lg:text-8xl
            leading-none
            font-normal
            whitespace-nowrap

            bg-gradient-to-b
            from-[#E98074]
            from-50%
            to-[#E98074]
            to-50%

            bg-clip-text
            text-transparent
          "
        >
          How It Works
        </h2>
      </div>


      {/* =========================
          SECTION HEADING
      ========================== */}
      <div className="max-w-3xl mx-auto text-center mb-16">

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
            text-gray-600
            text-base
            md:text-lg
            leading-8
          "
        >
          A simple, verified workflow designed for every role
          across the pharmaceutical ecosystem.
        </p>

      </div>

  {/* Workflow Cards */}
{/* Workflow Cards */}
{/* Workflow Cards */}
<div className="max-w-5xl mx-auto">
  <div
    className="
      w-full
      h-auto
      min-h-[520px]
      md:h-[360px]
      md:min-h-0
      rounded-2xl
      bg-[#A4B3B6]
      p-2
      flex
      flex-col
      md:flex-row
      gap-2
      overflow-hidden
      shadow-lg
    "
  >
    {workflows.map((workflow, index) => (
      <div
        key={workflow.title}
        className="
          group
          relative
          w-full
          min-h-[76px]
          md:h-full
          md:min-h-0
          md:flex-1
          md:min-w-0
          rounded-xl
          bg-[#f5ebeb]
          border
          border-[#D83F87]/50
          overflow-hidden
          cursor-pointer
          transition-all
          duration-500
          ease-in-out
          md:hover:flex-[4]
          hover:bg-[#44318D]
        "
      >
        {/* COLLAPSED CONTENT */}
        <div
          className="
            absolute
            inset-0
            flex
            flex-row
            md:flex-col
            items-center
            justify-center
            gap-4
            md:gap-5
            transition-all
            duration-500
            group-hover:opacity-0
            group-hover:scale-90
          "
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

        {/* EXPANDED CONTENT */}
        <div
          className="
            absolute
            inset-0
            flex
            flex-col
            justify-center
            p-5
            md:p-8
            opacity-0
            scale-95
            transition-all
            duration-500
            group-hover:opacity-100
            group-hover:scale-100
          "
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
    ))}
  </div>
</div>
    </section>
  );
};

export default HowItWorks;