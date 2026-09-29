
import React from "react";
import {
  BadgeCheck,
  ShieldCheck,
  LockKeyhole,
  Building2,
  UserCheck,
  FileCheck2,
} from "lucide-react";
// import TrustCards from "./trustcards";

// const verificationItems = [
//   {
//     icon: UserCheck,
//     title: "Identity",
//     text: "Professional identity and role information.",
//   },
//   {
//     icon: FileCheck2,
//     title: "Credentials",
//     text: "Relevant professional or business credentials.",
//   },
//   {
//     icon: Building2,
//     title: "Organization",
//     text: "Company and business information where applicable.",
//   },
// ];

const Trust = () => {
  return (
    <section
      id="trust"
      className="
        relative
     
         bg-[#A4B3B6]
      px-4
sm:px-6
md:px-12
lg:px-20
pb-16
md:pb-24
pt-28
md:pt-36
        text-[#2A1B3D]
       
        mt-[-20px]
        
      "
    >
      {/* =====================================================
          TOP CURVED BORDER
      ====================================================== */}
      <div
        className="
          absolute
          left-0
          top-0
          z-10
          h-[115px]
          w-full
          overflow-hidden
        
        "
      >
        <svg
          className="absolute left-0 top-0 h-full w-full"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="
              M0 0
              H1440
              V45
              C1260 125 1110 125 960 55
              C810 -15 630 -15 480 55
              C330 125 180 125 0 45
              Z
            "
            fill="#2A1B3D"
          />
        </svg>
      </div>

      {/* =====================================================
          DECORATIVE HEADING
      ====================================================== */}
<div className="absolute left-0 top-0 z-10 h-[150px] w-full   mt-[-50px]">
   <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 150" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" > 
   <path d=" M0 0 H1440 V45 C1260 125 1110 125 960 55 C810 -15 630 -15 480 55 C330 125 180 125 0 45 Z " fill="#2A1B3D" /> 
   </svg>
    {/* Decorative heading sits ON the curve */} 
   <div className=" absolute left-1/2 top-[48px] sm:top-[42px] z-30 -translate-x-1/2 whitespace-nowrap " >
  <h2
  className="
    font-['Great_Vibes']
    text-5xl
    sm:text-6xl
    md:text-7xl
    lg:text-8xl
    font-normal
    leading-none
    text-white/80
    drop-shadow-[0_2px_2px_rgba(42,27,61,0.25)]
    tracking-wide
  "
>
  Built on Trust
</h2>
    </div>
     </div>

      {/* =====================================================
          INTRO
      ====================================================== */}
      <div className="relative z-20 mx-auto max-w-3xl text-center">
        <p
          className="
            font-[Fauna_One]
            text-xs
            font-medium
            uppercase
            tracking-[3px]
            text-[#D83F87]
            md:text-sm
            mt-[-15px]
          "
        >
          Trust • Verification • Safety
        </p>

<h3
  className="
    mt-4
    text-center
    font-['Philosopher']
    text-2xl
    sm:text-3xl
    md:text-4xl
    lg:text-[42px]
    font-bold
    leading-[1.15]
  "
>
  <span className="block sm:inline">
    <span className="text-[#2A1B3D]">
      Verified connections.
    </span>
  </span>

  <span
    className="
      block
      sm:inline
      sm:ml-2
      md:ml-3
      text-[#44318D]
    "
  >
    Better professional interactions.
  </span>
</h3>
  {/* Verified connections.
  <span className="text-[#44318D]">
    Better professional interactions.
  </span>
</h3> */}



        <p
          className="
            mx-auto
            mt-5
            max-w-2xl
            font-[Fauna_One]
            text-sm
            leading-7
            text-[#2A1B3D]/65
            md:text-base
          "
        >
          PharmUnis is designed to bring greater clarity to professional
          connections by placing verification, relevance and responsible
          communication at the centre of the network.
        </p>
      </div>


{/* =====================================================
    VERIFICATION FOUNDATION
===================================================== */}


<div className="relative z-20 mx-auto mt-16 max-w-6xl">

  {/* FOUNDATION CARD */}
 {/* FOUNDATION CARD */}
{/* =====================================================
    FOUNDATION CARD
===================================================== */}

<div
  className="
    group
    relative
    overflow-hidden
    rounded-[28px]
    md:rounded-[32px]
    border
    border-[#44318D]/15
    bg-white
    shadow-[0_18px_55px_rgba(42,27,61,0.08)]
  "
>
  {/* Decorative top line */}
  <div className="absolute left-0 right-0 top-0 h-[3px]">
    <div className="h-full w-1/3 bg-[#D83F87]" />

    <div className="absolute left-1/3 top-0 h-full w-1/3 bg-[#44318D]" />

    <div className="absolute right-0 top-0 h-full w-1/3 bg-[#E98074]" />
  </div>

  {/* Background decoration */}
  <div
    className="
      pointer-events-none
      absolute
      -right-20
      -top-20
      h-64
      w-64
      rounded-full
      border
      border-[#44318D]/10
      md:-right-24
      md:-top-24
      md:h-72
      md:w-72
    "
  />

  <div
    className="
      pointer-events-none
      absolute
      -right-10
      -top-10
      h-40
      w-40
      rounded-full
      bg-[#44318D]/[0.035]
      md:-right-14
      md:-top-14
      md:h-48
      md:w-48
    "
  />

  {/* Main layout */}
  <div
    className="
      relative
      grid
      md:grid-cols-[200px_1fr]
    "
  >
    {/* =========================
        LEFT VERIFICATION PANEL
    ========================== */}
    <div
      className="
        flex
        items-center
        gap-5
        border-b
        border-[#44318D]/10
        bg-[#F7F5FA]
        px-6
        py-6

        md:flex-col
        md:justify-center
        md:gap-4
        md:border-b-0
        md:border-r
        md:px-6
        md:py-10
      "
    >
      {/* Seal */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center md:h-28 md:w-28">
        {/* Outer ring */}
        <div
          className="
            absolute
            inset-0
            rounded-full
            border
            border-[#44318D]/20
          "
        />

        {/* Dashed ring */}
        <div
          className="
            absolute
            inset-2
            rounded-full
            border
            border-dashed
            border-[#D83F87]/30
            transition-transform
            duration-700
            group-hover:rotate-12
          "
        />

        {/* Inner seal */}
        <div
          className="
            relative
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-[#44318D]
            text-[#E98074]
            shadow-[0_12px_30px_rgba(68,49,141,0.22)]
            transition-transform
            duration-300
            group-hover:scale-105

            md:h-[68px]
            md:w-[68px]
          "
        >
          <BadgeCheck
            size={26}
            strokeWidth={1.7}
            className="md:h-[34px] md:w-[34px]"
          />

          <span
            className="
              absolute
              right-0
              top-0
              h-3
              w-3
              rounded-full
              border-2
              border-[#44318D]
              bg-[#D83F87]

              md:right-1
              md:top-1
              md:h-4
              md:w-4
              md:border-[3px]
            "
          />
        </div>
      </div>

      {/* Mobile / desktop seal text */}
      <div className="md:text-center">
        <p
          className="
            font-[Fauna_One]
            text-[9px]
            font-semibold
            uppercase
            tracking-[2px]
            text-[#44318D]
          "
        >
          Verified foundation
        </p>

        <p
          className="
            mt-1
            font-[Fauna_One]
            text-[10px]
            leading-5
            text-[#2A1B3D]/50
          "
        >
          Verification comes first
        </p>
      </div>
    </div>

    {/* =========================
        RIGHT CONTENT
    ========================== */}
    <div
      className="
        relative
        px-6
        py-7
        sm:px-7
        sm:py-8
        md:px-10
        md:py-10
        lg:px-12
        lg:py-12
      "
    >
      {/* Label */}
      <div className="flex items-center gap-3">
        <span className="h-[2px] w-8 bg-[#D83F87]" />

        <p
          className="
            font-[Fauna_One]
            text-[10px]
            font-semibold
            uppercase
            tracking-[3px]
            text-[#44318D]
          "
        >
          The foundation
        </p>
      </div>

      {/* Heading */}
      <h6
        className="
          mt-3
          max-w-2xl
          font-['Philosopher']
          text-[25px]
          sm:text-[27px]
          md:text-[30px]
          font-bold
          leading-tight
          text-[#2A1B3D]
        "
      >
        Verification comes first.
      </h6>

      {/* Description */}
      <p
        className="
          mt-3
          max-w-2xl
          font-[Fauna_One]
          text-[13px]
          sm:text-sm
          md:text-[15px]
          leading-6
          md:leading-7
          text-[#2A1B3D]/60
        "
      >
        Different roles may require different verification
        requirements. PharmUnis is designed to make relevant
        professional information clearer before meaningful
        connections begin.
      </p>

      {/* Bottom detail */}
      <div
        className="
          mt-6
          flex
          flex-wrap
          items-center
          gap-3
        "
      >
        <span className="h-[1px] w-10 bg-[#44318D]/15 md:w-16" />

        <span
          className="
            font-[Fauna_One]
            text-[9px]
            font-semibold
            uppercase
            tracking-[2px]
            text-[#A4B3B6]
          "
        >
          Built for clarity
        </span>

        <span className="h-[1px] w-10 bg-[#44318D]/15 md:w-16" />
      </div>
    </div>
  </div>
</div>

  {/* =====================================================
      WHAT CAN BE CHECKED
  ===================================================== */}

  {/* <div className="mt-12"> */}

    {/* HEADER */}
    {/* <div className="mb-7 flex items-end justify-between gap-6">

      <div>
        <div className="flex items-center gap-3">
          <span className="h-[2px] w-8 bg-[#D83F87]" />

          <p
            className="
              font-[Fauna_One]
              text-[10px]
              font-semibold
              uppercase
              tracking-[3px]
              text-[#44318D]
            "
          >
            What can be checked
          </p>
        </div> */}

        {/* <p
          className="
            mt-3
            max-w-xl
            font-[Fauna_One]
            text-sm
            leading-6
            text-[#2A1B3D]/55
          "
        >
          Relevant professional information can be reviewed to bring greater
          clarity to each connection.
        </p>
      </div> */}

      {/* <span
        className="
          hidden
          font-['Philosopher']
          text-5xl
          font-bold
          leading-none
          text-[#44318D]/10
          md:block
        "
      >
        03
      </span> */}

    {/* </div> */}


    {/* THREE CARDS */}
    {/* <div className="grid gap-5 md:grid-cols-3">

      {verificationItems.map((item, index) => {
        const Icon = item.icon;

        const accents = [
          {
            color: "#D83F87",
            soft: "bg-[#D83F87]/[0.07]",
          },
          {
            color: "#44318D",
            soft: "bg-[#44318D]/[0.07]",
          },
          {
            color: "#E98074",
            soft: "bg-[#E98074]/[0.09]",
          },
        ];

        const accent = accents[index];

        return (
          <div
            key={item.title}
            className="
              group
              relative
              overflow-hidden
              rounded-[24px]
              border
              border-[#44318D]/12
              bg-white
              p-6
              shadow-[0_8px_28px_rgba(42,27,61,0.05)]
              transition-all
              duration-300
              hover:-translate-y-1
              hover:shadow-[0_15px_35px_rgba(42,27,61,0.10)]
            "
          >

            {/* top accent */}
            {/* <div
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ backgroundColor: accent.color }}
            /> */}

            {/* decorative circle */}
            {/* <div
              className={`
                pointer-events-none
                absolute
                -right-8
                -top-8
                h-24
                w-24
                rounded-full
                ${accent.soft}
                transition-transform
                duration-500
                group-hover:scale-125
              `}
            /> */} 

            {/* number */}
            {/* <span
              className="
                absolute
                right-5
                top-5
                font-[Fauna_One]
                text-[10px]
                font-semibold
                tracking-[2px]
                text-[#A4B3B6]
              "
            >
              0{index + 1}
            </span> */}


            {/* icon */}
            {/* <div
              className="
                relative
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-[16px]
                text-white
                shadow-sm
                transition-transform
                duration-300
                group-hover:scale-105
              "
              style={{ backgroundColor: accent.color }}
            >
              <Icon size={21} strokeWidth={1.8} />
            </div> */}


            {/* content */}
            {/* <div className="relative mt-6">

              <h5
                className="
                  font-['Philosopher']
                  text-2xl
                  font-bold
                  text-[#2A1B3D]
                "
              >
                {item.title}
              </h5>

              <p
                className="
                  mt-2
                  font-[Fauna_One]
                  text-xs
                  leading-6
                  text-[#2A1B3D]/55
                  md:text-sm
                "
              >
                {item.text}
              </p>

            </div> */}


            {/* bottom detail */}
            {/* <div className="mt-7 flex items-center gap-2">

              <span
                className="h-[2px] w-8 transition-all duration-300 group-hover:w-14"
                style={{ backgroundColor: accent.color }}
              />

              <span className="h-1 w-1 rounded-full bg-[#A4B3B6]" />

            </div>

          </div>
        );
      })}

    </div>

  </div> */}

{/* </div> */}

{/* =====================================================
    TRUST + SAFETY
===================================================== */}



  {/* =====================================================
      SAFETY
  ===================================================== */}
{/* 
  <div className="mx-auto mt-12 flex w-full max-w-6xl justify-end">

    <div
      className="
        relative
        w-full
        overflow-hidden
        rounded-[26px]
        border
        border-[#44318D]/15
        bg-white
        p-7
        shadow-[0_10px_35px_rgba(42,27,61,0.06)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_16px_40px_rgba(42,27,61,0.10)]
        md:max-w-4xl
        md:p-9
      "
    >

      {/* Coral edge */}
{/* 
      <div
        className="
          absolute
          bottom-0
          left-0
          top-0
          w-[4px]
          bg-[#E98074]
        "
      /> */}

      {/* Decorative shape */}

      {/* <div
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-40
          w-40
          rounded-full
          bg-[#E98074]/[0.06]
        "
      /> */}

      {/* <div className="relative"> */}

        {/* Header */}

        {/* <div className="flex items-center justify-between gap-5">

          <div className="flex items-center gap-4">

            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[#E98074]/10
                text-[#E98074]
              "
            >
              <LockKeyhole size={24} strokeWidth={1.8} /> */} 
            {/* </div> */}

            {/* <div>

              <p
                className="
                  font-[Fauna_One]
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[2px]
                  text-[#E98074]
                "
              >
                05
              </p>

              <h4
                className="
                  font-['Philosopher']
                  text-2xl
                  font-bold
                  text-[#2A1B3D]
                "
              >
                Safety
              </h4>

            </div>

          </div>

          <span
            className="
              hidden
              font-[Fauna_One]
              text-[9px]
              font-semibold
              uppercase
              tracking-[2px]
              text-[#A4B3B6]
              sm:block
            "
          >
            Responsible communication
          </span>

        </div> */}


        {/* Description */}
{/* 
        <p
          className="
            relative
            mt-6
            max-w-3xl
            font-[Fauna_One]
            text-sm
            leading-7
            text-[#2A1B3D]/65
            md:ml-16
            md:text-[15px]
          "
        >
          Professional communication should have a clear purpose. Users
          can have greater control over the requests they receive and the
          connections they choose to engage with.
        </p> */}

      {/* </div> */}

    {/* </div>

  </div>

</div> */}

{/* </div> */}

  {/* =====================================================
          BOTTOM NOTE
      ====================================================== */}
      {/* <div className="relative z-20 mx-auto mt-10 max-w-3xl text-center">
        <p
          className="
            font-[Fauna_One]
            text-xs
            leading-6
            text-[#2A1B3D]/45
            md:text-sm
          "
        >
          PharmUnis supports professional networking — it does not replace
          professional judgement, regulatory requirements or existing
          healthcare processes.
        </p>
      </div> */}

      </div>
    </section>
  );
};

export default Trust;

