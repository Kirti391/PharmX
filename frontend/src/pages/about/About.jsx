import { Link } from "react-router-dom";
import React from "react";
import { UsersRound, ArrowRight } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="min-h-screen bg-gradient-to-r from-[#2A1B3D] to-[#44318D] text-white px-6 md:px-12 lg:px-20 py-10">

      {/* Heading */}
    <div className="max-w-4xl mx-auto text-center mt-10 md:mt-20">
  <p className="font-[Fauna_One] text-[#D83F87] text-xs sm:text-sm md:text-base tracking-[2px] md:tracking-[3px] uppercase mb-4 md:mb-5">
    One Network. Every Pharma Role.
  </p>

  <h2 className="font-[Cinzel] text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold">
    Trusted digital network for the{" "}
    <span className="text-[#D83F87]">
      pharma ecosystem
    </span>
  </h2>

  <p className="font-[Fauna_One] text-gray-200 text-sm sm:text-base md:text-lg leading-7 md:leading-8 max-w-3xl mx-auto mt-5 md:mt-6 px-2">
    Connect verified companies, MRs, pharmacies, distributors and
    healthcare professionals for relevant business needs.
  </p>
</div>

      {/* Buttons */}
<div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 md:mt-12">

        <Link
          to="/signup"
          className="
  flex items-center justify-center gap-2.5
  w-full sm:w-auto
  bg-[#D83F87]
  hover:bg-[#E98074]
  text-white hover:text-[#2A1B3D]
  font-[Fauna_One] font-semibold
  py-3.5 px-6 rounded-xl
  transition-all duration-300
"
        >
          <UsersRound size={19} strokeWidth={2} />
          <span>Join PharmUnis</span>
        </Link>

        <a
          href="#footer"
          className="
            flex
            items-center
            justify-center
            gap-2.5
            bg-[#D83F87]
            hover:bg-[#E98074]
            text-white
            hover:text-[#2A1B3D]
            font-[Fauna_One]
            font-semibold
            py-3.5
            px-6
            rounded-xl
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-xl
          "
        >
          <span>More About Us</span>
          <ArrowRight size={19} strokeWidth={2} />
        </a>

      </div>

    </section>
  );
};

export default About;
