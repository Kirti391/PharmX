"use client";

import { Link } from "react-router-dom";
import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const roles = [
  {
    number: "01",
    title: "Pharmacy",
    description:
      "Find verified suppliers, distributors and relevant pharmaceutical connections for your pharmacy needs.",
    action: "Join as Pharmacy",
  },
  {
    number: "02",
    title: "Medical Representative/Executive",
    description:
      "Build your professional profile, discover relevant opportunities and manage authorized connections.",
    action: "Join as MR",
  },
  {
    number: "03",
    title: "Pharma Company",
    description:
      "Connect with MRs, distributors, pharmacies and relevant demand across your business network.",
    action: "Join as Company",
  },
  {
    number: "04",
    title: "Distributor",
    description:
      "Find relevant pharmacies and pharmaceutical companies within your service and supply area.",
    action: "Join as Distributor",
  },
  {
    number: "05",
    title: "Doctor",
    description:
      "Control professional communication with MRs and decide which relevant requests you want to receive.",
    action: "Join as Doctor",
  },
];

/* =========================
   STICKY ROLE CARD
========================= */

const StickyRoleCard = ({
  role,
  progress,
  range,
  targetScale,
}) => {
  const scale = useTransform(
    progress,
    range,
    [1, targetScale]
  );

  return (
    <div
      className="
        sticky
        top-20
        md:top-24
        flex
        h-[330px]
        sm:h-[350px]
        md:h-[360px]
        items-start
        justify-center
      "
    >
      <motion.div
        style={{ scale }}
        className="
          relative
          h-[280px]
          sm:h-[300px]
          md:h-[300px]
          w-full
          max-w-[850px]
          origin-top
          overflow-hidden
          rounded-2xl
          md:rounded-3xl
          border
          border-[#A4B3B6]/60
          bg-[#E8E3E6]
          p-5
          sm:p-6
          md:p-8
          shadow-xl
        "
      >
        {/* =========================
            TOP ROW
        ========================== */}
        <div className="flex items-center justify-between">
          <span
            className="
              font-['Unica_One']
              text-xs
              tracking-[3px]
              text-[#D83F87]
            "
          >
            {role.number}
          </span>

          <span className="h-2.5 w-2.5 rounded-full bg-[#D83F87]" />
        </div>

        {/* =========================
            CONTENT
        ========================== */}
        <div className="mt-5 sm:mt-6 md:mt-7">
          <p
            className="
              mb-2
              font-[Fauna_One]
              text-[9px]
              sm:text-[10px]
              uppercase
              tracking-[2px]
              sm:tracking-[3px]
              text-[#D83F87]
            "
          >
            PharmUnis Role
          </p>

          <h3
            className="
              max-w-3xl
              font-['Philosopher']
              text-2xl
              sm:text-3xl
              md:text-4xl
              font-bold
              leading-tight
              text-[#2A1B3D]
            "
          >
            {role.title}
          </h3>

          <p
            className="
              mt-2
              sm:mt-3
              max-w-2xl
              font-[Fauna_One]
              text-[11px]
              sm:text-xs
              md:text-sm
              leading-5
              sm:leading-6
              md:leading-7
              text-[#2A1B3D]/70
            "
          >
            {role.description}
          </p>
        </div>

        {/* =========================
            BOTTOM
        ========================== */}
       <div
  className="
    absolute
    bottom-5
    left-5
    right-5

    sm:bottom-6
    sm:left-6
    sm:right-6

    md:bottom-8
    md:left-8
    md:right-8

    flex
    flex-col
    sm:flex-row
    items-start
    sm:items-center
    justify-between
    gap-3
    sm:gap-4
  "
>
  <div
    className="
      flex
      items-center
      gap-2.5
      font-[Fauna_One]
      text-[10px]
      text-[#2A1B3D]/55

      md:text-xs
    "
  >
    <span
      className="
        flex
        h-6
        w-6
        shrink-0
        items-center
        justify-center
        rounded-md
        bg-[#D83F87]
        font-['Unica_One']
        text-[10px]
        text-white
      "
    >
      {role.number}
    </span>

    <span className="whitespace-nowrap">
  Verified professional connection
</span>
  </div>

  <Link to="/signup">
    <button
      className="
        shrink-0
        rounded-lg
        border
        border-[#D83F87]
        bg-[#D83F87]
        px-4
        py-2
        font-[Fauna_One]
        text-[9px]
        font-semibold
        text-white
        transition-all
        duration-300
        hover:border-[#2A1B3D]
        hover:bg-[#2A1B3D]

        sm:px-5
        sm:py-2.5
        sm:text-[10px]

        md:px-6
        md:py-3
        md:text-xs
      "
    >
      {role.action}
    </button>
  </Link>
</div>
      </motion.div>
    </div>
  );
};

/* =========================
   ROLES SECTION
========================= */

const Roles = () => {
  const container = useRef(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="roles"
      ref={container}
      className="
        relative
        bg-[#2A1B3D]
        text-[#A4B3B6]
        px-4
        sm:px-6
        md:px-12
        lg:px-20
        pt-24
        sm:pt-28
        pb-20
        md:pb-16
      "
    >
      {/* =========================
          CURSIVE TITLE
      ========================== */}
      <div
        className="
          absolute
          top-0
          left-1/2
          z-20
          w-full
          -translate-x-1/2
          -translate-y-1/2
          text-center
          pointer-events-none
          overflow-hidden
        "
      >
        <h2
          className="
            font-['Great_Vibes']
            text-5xl
            sm:text-6xl
            md:text-8xl
            font-normal
            leading-none
            tracking-wide
            text-[#E98074]
            whitespace-nowrap
          "
        >
          Choose your role?
        </h2>
      </div>

      {/* =========================
          INTRO
      ========================== */}
      <div
        className="
          mx-auto
          mb-5
          sm:mb-6
          md:mb-8
          max-w-3xl
          text-center
        "
      >
        <p
          className="
            mx-auto
            max-w-2xl
            font-[Fauna_One]
            text-xs
            sm:text-sm
            md:text-base
            leading-6
            sm:leading-7
            text-[#A4B3B6]
          "
        >
          PharmUnis connects different participants in the
          pharmaceutical ecosystem through verified and
          purposeful professional connections.
        </p>
      </div>

      {/* =========================
          CARD STACK
      ========================== */}
      <div className="relative mx-auto max-w-5xl">
        {roles.map((role, i) => {
          const targetScale =
            1 - (roles.length - i - 1) * 0.055;

          return (
            <StickyRoleCard
              key={role.title}
              role={role}
              progress={scrollYProgress}
              range={[i * 0.18, 1]}
              targetScale={targetScale}
            />
          );
        })}
      </div>

      {/* =========================
          SUPPORTING MESSAGE
      ========================== */}
      <div
        className="
          mx-auto
          mt-2
          max-w-2xl
          text-center
          pb-20
          md:pb-0
        "
      >
        <p
          className="
            font-[Fauna_One]
            text-[10px]
            sm:text-xs
            md:text-sm
            leading-6
            text-[#A4B3B6]/90
          "
        >
          Every role follows its own verification and
          communication requirements on PharmUnis.
        </p>
      </div>
    </section>
  );
};

export default Roles;