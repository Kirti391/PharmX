import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  UserCheck,
  FileCheck2,
} from "lucide-react";

const verificationItems = [
  {
    icon: UserCheck,
    title: "Identity",
    text: "Professional identity and role information.",
  },
  {
    icon: FileCheck2,
    title: "Credentials",
    text: "Relevant professional or business credentials.",
  },
  {
    icon: Building2,
    title: "Organization",
    text: "Company and business information where applicable.",
  },
];

const TrustCards = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
      }
    );

    const section = sectionRef.current;

    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

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

  return (
    <section
      ref={sectionRef}
      id="verification"
      className="w-full overflow-hidden bg-[#F7F5FA] py-20 md:py-15 lg:py-15"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">

        {/* HEADER */}
        <div
          className={`
            mb-10
            flex
            items-end
            justify-between
            gap-6
            transition-all
            duration-1000
            ease-out
            md:mb-12
            ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-24 opacity-0"
            }
          `}
        >
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
            </div>

            <p
              className="
                mt-3
                max-w-xl
                font-[Fauna_One]
                text-sm
                leading-6
                text-[#2A1B3D]/55
                md:text-base
              "
            >
              Relevant professional information can be reviewed to bring
              greater clarity to each connection.
            </p>
          </div>
        </div>

        {/* THREE CARDS */}
        <div className="grid gap-5 md:grid-cols-3">
          {verificationItems.map((item, index) => {
            const Icon = item.icon;
            const accent = accents[index];

            return (
              <div
                key={item.title}
                className={`
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
                  duration-1000
                  ease-out
                  hover:-translate-y-1
                  hover:shadow-[0_15px_35px_rgba(42,27,61,0.10)]
                  md:p-7
                  ${
                    isVisible
                      ? "translate-x-0 translate-y-0 opacity-100"
                      : index === 0
                        ? "-translate-x-24 opacity-0"
                        : index === 1
                          ? "translate-y-24 opacity-0"
                          : "translate-x-24 opacity-0"
                  }
                `}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                {/* TOP ACCENT */}
                <div
                  className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ backgroundColor: accent.color }}
                />

                {/* DECORATIVE CIRCLE */}
                <div
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
                />

                {/* NUMBER */}
                <span
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
                </span>

                {/* ICON */}
                <div
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
                </div>

                {/* CONTENT */}
                <div className="relative mt-6">
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
                </div>

                {/* BOTTOM DETAIL */}
                <div className="mt-7 flex items-center gap-2">
                  <span
                    className="
                      h-[2px]
                      w-8
                      transition-all
                      duration-300
                      group-hover:w-14
                    "
                    style={{ backgroundColor: accent.color }}
                  />

                  <span className="h-1 w-1 rounded-full bg-[#A4B3B6]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustCards;