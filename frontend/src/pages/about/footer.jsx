import {
  FaLinkedinIn,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaEnvelope,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="footer" className="relative overflow-hidden bg-[#2A1B3D] text-white">
      {/* Decorative background */}
      {/* <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full border border-[#D83F87]/20" />
      <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full border border-[#E98074]/15" /> */}

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
        {/* Main Footer */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          
          {/* Brand */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D83F87]">
                <span className="font-serif text-xl font-bold text-white">
                  P
                </span>
              </div>

              <span className="font-[Philosopher] text-2xl font-bold tracking-wide">
                PharmUnis
              </span>
            </div>

            <p className="max-w-sm font-[Fauna_One] text-sm leading-7 text-white/65">
              A trusted professional network connecting pharmacists,
              organizations, and opportunities to build a stronger
              pharmaceutical community.
            </p>

            {/* Socials */}
            <div className="mt-7 flex items-center gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-[#D83F87] hover:bg-[#D83F87] hover:text-white"
              >
                <FaLinkedinIn size={16} />
              </a>

              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-[#D83F87] hover:bg-[#D83F87] hover:text-white"
              >
                <FaInstagram size={17} />
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-[#D83F87] hover:bg-[#D83F87] hover:text-white"
              >
                <FaFacebookF size={15} />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-[#D83F87] hover:bg-[#D83F87] hover:text-white"
              >
                <FaTwitter size={16} />
              </a>

              <a
                href="mailto:hello@pharmunis.com"
                aria-label="Email"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-[#E98074] hover:bg-[#E98074] hover:text-white"
              >
                <FaEnvelope size={16} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-6 font-[Philosopher] text-lg text-white">
              Explore
            </h3>

            <ul className="space-y-4 font-[Fauna_One] text-sm text-white/60">
              <li>
                <a href="#about" className="transition hover:text-[#D83F87]">
                  About Us
                </a>
              </li>
              <li>
                <a href="#roles" className="transition hover:text-[#D83F87]">
                  Professional Roles
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="transition hover:text-[#D83F87]">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#trust" className="transition hover:text-[#D83F87]">
                  Trust & Safety
                </a>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-6 font-[Philosopher] text-lg text-white">
              Platform
            </h3>

            <ul className="space-y-4 font-[Fauna_One] text-sm text-white/60">
              <li>
                <a href="#" className="transition hover:text-[#D83F87]">
                  Find Professionals
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-[#D83F87]">
                  Find Opportunities
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-[#D83F87]">
                  For Organizations
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-[#D83F87]">
                  Join PharmUnis
                </a>
              </li>
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h3 className="mb-6 font-[Philosopher] text-lg text-white">
              Stay Connected
            </h3>

            <p className="mb-5 font-[Fauna_One] text-sm leading-6 text-white/60">
              Stay updated with professional opportunities and
              developments across the pharmacy community.
            </p>

            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#D83F87] px-6 py-3 font-[Fauna_One] text-sm font-medium text-white transition hover:bg-[#E98074]"
            >
            <Link to="/signup" >
            Get Started
          </Link>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-white/10" />

        {/* Bottom */}
        <div className="flex flex-col gap-5 font-[Fauna_One] text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} PharmUnis. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-6">
            <a href="#" className="transition hover:text-white">
              Privacy Policy
            </a>

            <a href="#" className="transition hover:text-white">
              Terms of Service
            </a>

            <a href="#" className="transition hover:text-white">
              Community Guidelines
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;