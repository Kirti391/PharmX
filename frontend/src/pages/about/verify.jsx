import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

const TrustBanner = () => {
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

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#44318D]"
    >
      {/* =====================================================
          DECORATIVE BACKGROUND
      ====================================================== */}

      {/* <div
        className="
          pointer-events-none
          absolute
          -left-28
          -top-28
          h-80
          w-80
          rounded-full
          bg-[#D83F87]/10
        "
      /> */}

      {/* <div
        className="
          pointer-events-none
          absolute
          -bottom-32
          right-[-40px]
          h-80
          w-80
          rounded-full
          border
          border-white/10
        "
      /> */}

      {/* <div
        className="
          pointer-events-none
          absolute
          right-[15%]
          top-1/2
          h-28
          w-28
          -translate-y-1/2
          rounded-full
          bg-[#E98074]/10
        "
      /> */}

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-7xl
          px-6
          py-14
          md:px-12
          md:py-16
          lg:px-20
          lg:py-20
        "
      >
        <div
          className="
            grid
            items-center
            gap-10
            md:grid-cols-[0.85fr_1.15fr]
            md:gap-16
            lg:gap-24
          "
        >
          {/* =================================================
              LEFT
          ================================================== */}

          <div
            className={`
              relative
              transition-all
              duration-[1000ms]
              ease-out
              ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-24 opacity-0"
              }
            `}
          >
            {/* Decorative quote */}
            <span
              className="
                pointer-events-none
                absolute
                -left-12
                -top-16
                font-['Philosopher']
                text-[150px]
                font-bold
                leading-none
                text-white/[0.07]
                md:text-[180px]
              "
            >
              “
            </span>

            <div className="relative">
              <h2
                className="
                  max-w-lg
                  font-['Philosopher']
                  text-4xl
                  font-bold
                  leading-[1.05]
                  text-white
                  md:text-5xl
                  lg:text-6xl
                "
              >
                Trust grows
                <span className="block text-[#E98074]">
                  through clarity.
                </span>
              </h2>
            </div>
          </div>

          {/* =================================================
              RIGHT
          ================================================== */}

          <div
            className={`
              relative
              border-t
              border-white/15
              pt-8
              transition-all
              duration-[1000ms]
              ease-out
              md:border-l
              md:border-t-0
              md:pl-14
              md:pt-0
              ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-24 opacity-0"
              }
            `}
            style={{
              transitionDelay: "180ms",
            }}
          >
            <p
              className="
                max-w-2xl
                font-[Fauna_One]
                text-sm
                leading-7
                text-white/75
                md:text-[15px]
                md:leading-8
              "
            >
              Clear professional profiles and relevant information can help
              participants make more informed decisions about who they choose
              to connect with.
            </p>

            {/* Trust indicator */}

            <div
              className={`
                mt-8
                flex
                items-center
                gap-4
                transition-all
                duration-700
                ease-out
                ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }
              `}
              style={{
                transitionDelay: "500ms",
              }}
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/20
                  bg-white/10
                  text-[#E98074]
                "
              >
                <ShieldCheck
                  size={20}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <p
                  className="
                    font-[Fauna_One]
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[2px]
                    text-white/40
                  "
                >
                  Built for
                </p>

                <p
                  className="
                    mt-1
                    font-[Fauna_One]
                    text-xs
                    font-medium
                    tracking-wide
                    text-white/85
                  "
                >
                  Clearer professional connections
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;