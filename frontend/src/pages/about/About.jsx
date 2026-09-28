import { Link } from "react-router-dom";
import React from "react";
import { UsersRound, ArrowRight } from "lucide-react";

const About = () => {
  return (
    <section className="min-h-screen bg-gradient-to-r from-[#2A1B3D] to-[#44318D] text-white px-6 md:px-12 lg:px-20 py-10">

      {/* Heading */}
      <div className="max-w-4xl mx-auto text-center mt-20">
        <p className="font-[Fauna_One] text-[#D83F87] text-sm md:text-base tracking-[3px] uppercase mb-5">
          One Network. Every Pharma Role.
        </p>

        <h2 className="font-[Cinzel] text-4xl md:text-5xl lg:text-6xl leading-tight font-semibold">
          Trusted digital network for the{" "}
          <span className="text-[#D83F87]">
            pharma ecosystem
          </span>
        </h2>

        <p className="font-[Fauna_One] text-gray-200 text-base md:text-lg leading-8 max-w-3xl mx-auto mt-6">
          Connect verified companies, MRs, pharmacies, distributors and
          healthcare professionals for relevant business needs.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-center gap-4 mt-12">

        <button
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
          <UsersRound size={19} strokeWidth={2} />
          <span><Link to="/signup" >
           Join PharmUnis
          </Link></span>
           
        </button>

        <button
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
          <span><a href="#footer">More About Us</a></span>
          <ArrowRight size={19} strokeWidth={2} />
        </button>

      </div>

    </section>
  );
};

export default About;

