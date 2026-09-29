
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../assets/pharmunis logo.png";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <nav
      className="
        relative
        w-full
        h-[70px]
        md:h-[80px]
        bg-white/90
        backdrop-blur-md
        border-b
        border-gray-200
        flex
        items-center
        px-4
        sm:px-6
        md:px-10
        lg:px-16
        sticky
        top-0
        z-50
      "
    >
      {/* =========================
          LOGO
      ========================== */}
      <Link
        to="/"
        className="flex items-center gap-2 shrink-0"
        onClick={closeMenu}
      >
        <img
          src={logo}
          alt="PharmUnis"
          className="
            h-9
            w-9
            sm:h-10
            sm:w-10
            object-contain
          "
        />

        <p
          className="
            font-[Cinzel]
            text-xl
            sm:text-2xl
            md:text-3xl
            text-[#2A1B3D]
            whitespace-nowrap
          "
        >
          Pharm<span className="text-[#D83F87]">Unis</span>
        </p>
      </Link>

      {/* =========================
          DESKTOP NAVIGATION
      ========================== */}
      <div className="hidden md:flex ml-auto items-center gap-8">

        {/* Navigation Links */}
        <ul
          className="
            flex
            items-center
            gap-8
            font-[Fauna_One]
            text-sm
            text-[#2A1B3D]
          "
        >
          <li>
            <a
              href="#how-it-works"
              className="
                hover:text-[#D83F87]
                transition-colors
                duration-300
              "
            >
              How it works
            </a>
          </li>

          <li>
            <a
              href="#roles"
              className="
                hover:text-[#D83F87]
                transition-colors
                duration-300
              "
            >
              Roles
            </a>
          </li>

          <li>
            <a
              href="#trust"
              className="
                hover:text-[#D83F87]
                transition-colors
                duration-300
              "
            >
              Verification
            </a>
          </li>
        </ul>

        {/* Desktop Buttons */}
        <div className="flex items-center gap-3 font-[Fauna_One]">

          <Link
            to="/login"
            className="
              px-5
              py-2.5
              text-[#2A1B3D]
              border
              border-[#2A1B3D]/20
              rounded-lg
              hover:border-[#D83F87]
              hover:text-[#D83F87]
              transition-all
              duration-300
            "
          >
            Log in
          </Link>

          <Link
            to="/signup"
            className="
              px-5
              py-2.5
              bg-[#2A1B3D]
              text-white
              rounded-lg
              hover:bg-[#44318D]
              transition-all
              duration-300
              shadow-md
              hover:shadow-lg
            "
          >
            Get Started
          </Link>

        </div>
      </div>

      {/* =========================
          MOBILE CONTROLS
      ========================== */}
      <div className="ml-auto flex items-center gap-2 md:hidden">

        {/* Get Started */}
        <Link
          to="/signup"
          className="
            px-3
            py-2
            sm:px-4
            sm:py-2.5
            text-xs
            sm:text-sm
            font-[Fauna_One]
            bg-[#2A1B3D]
            text-white
            rounded-lg
            hover:bg-[#44318D]
            transition-all
            duration-300
          "
        >
          Get Started
        </Link>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="
            flex
            items-center
            justify-center
            h-10
            w-10
            rounded-lg
            text-[#2A1B3D]
            hover:bg-[#F7F5FA]
            transition-colors
            duration-300
          "
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      {/* =========================
          MOBILE MENU
      ========================== */}
      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-full
            bg-white
            border-b
            border-gray-200
            shadow-lg
            md:hidden
          "
        >
          <div
            className="
              flex
              flex-col
              px-5
              py-5
              gap-4
              font-[Fauna_One]
            "
          >

            {/* How It Works */}
            <a
              href="#how-it-works"
              onClick={closeMenu}
              className="
                py-2
                text-[#2A1B3D]
                hover:text-[#D83F87]
                transition-colors
              "
            >
              How it works
            </a>

            {/* Roles */}
            <a
              href="#roles"
              onClick={closeMenu}
              className="
                py-2
                text-[#2A1B3D]
                hover:text-[#D83F87]
                transition-colors
              "
            >
              Roles
            </a>

            {/* Verification */}
            <a
              href="#trust"
              onClick={closeMenu}
              className="
                py-2
                text-[#2A1B3D]
                hover:text-[#D83F87]
                transition-colors
              "
            >
              Verification
            </a>

            {/* Login */}
            <Link
              to="/login"
              onClick={closeMenu}
              className="
                py-2
                text-[#2A1B3D]
                hover:text-[#D83F87]
                transition-colors
              "
            >
              Log in
            </Link>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
