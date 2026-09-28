import { Link } from "react-router-dom";
import React from "react";
import logo from "../../assets/pharmunis logo.png"
const Navbar = () => {
  return (
    <nav className="w-full h-[80px] bg-white/40  border-b border-gray-200 flex items-center px-6 md:px-10 lg:px-16 sticky top-0 z-50">

      {/* Logo */}
      <div className="flex items-center h-10 w-10 gap-1.5"><img src={logo} alt="pharmunis"  />
        <p className="font-[Cinzel] text-2xl md:text-3xl  text-[#2A1B3D]">
          Pharm<span className="text-[#D83F87]">Unis</span>
        </p>
        
      </div>

      {/* Right Section */}
      <div className="ml-auto flex items-center gap-8">

        {/* Navigation */}
        <ul className="hidden md:flex items-center gap-8 font-[Fauna_One] text-sm text-[#2A1B3D]">

          <li>
            <a
              href="#how-it-works"
              className="relative hover:text-[#D83F87] transition-colors duration-300"
            >
              How it works
            </a>
          </li>

          <li>
            <a
              href="#roles"
              className="relative hover:text-[#D83F87] transition-colors duration-300"
            >
              Roles
            </a>
          </li>

          <li>
            <a
              href="#verification"
              className="relative hover:text-[#D83F87] transition-colors duration-300"
            >
              Verification
            </a>
          </li>

        </ul>

        {/* Buttons */}
        <div className="flex items-center gap-3 font-[Fauna_One]">

          {/* <button 
            className="hidden sm:block px-5 py-2.5 text-[#2A1B3D] border border-[#2A1B3D]/20 rounded-lg hover:border-[#D83F87] hover:text-[#D83F87] transition-all duration-300"
          >
            Login
          </button> */}
           <Link to="/login"  className="hidden sm:block px-5 py-2.5 text-[#2A1B3D] border border-[#2A1B3D]/20 rounded-lg hover:border-[#D83F87] hover:text-[#D83F87] transition-all duration-300">
            Log in
          </Link>

          {/* <button
            className="px-5 py-2.5 bg-[#2A1B3D] text-white rounded-lg hover:bg-[#44318D] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Join PharmUnis
          </button> */}
          <Link to="/signup"  className="px-5 py-2.5 bg-[#2A1B3D] text-white rounded-lg hover:bg-[#44318D] transition-all duration-300 shadow-md hover:shadow-lg">
            Get Started
          </Link>

        </div>

      </div>
    </nav>
  );
};

export default Navbar;
