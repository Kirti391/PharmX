import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SURFACE } from "./dashboardTheme";

/* =========================================================
   PHARMUNIS — PARTNERSHIP PROMO CARD
   Lavender editorial card promoting supplier discovery.
========================================================= */

export function PartnershipPromoCard() {
  return (
    <section
      className="relative overflow-hidden rounded-[16px] px-6 py-7"
      style={{ backgroundColor: SURFACE.lavender }}
    >
      <span
        className="absolute right-5 top-5 h-2 w-2 rounded-full"
        style={{ backgroundColor: SURFACE.pink }}
      />

      <h2
        className="max-w-[210px] font-editorial text-[19px] font-semibold leading-snug"
        style={{ color: SURFACE.ink }}
      >
        Build stronger pharmaceutical partnerships.
      </h2>

      <p
        className="mt-3 font-script text-[16px] leading-7"
        style={{ color: SURFACE.inkSoft }}
      >
        Explore verified companies, distributors and medical
        representatives across your territory.
      </p>

      <Link
        to="/discover/companies"
        className="
          group mt-5 inline-flex items-center gap-2 rounded-full bg-white
          px-5 py-3 font-script text-[16px] leading-none transition-all
          duration-200 hover:-translate-y-[1px]
          hover:shadow-[0_10px_22px_rgba(42,27,61,0.10)]
        "
        style={{ color: SURFACE.ink }}
      >
        Explore companies
        <ArrowRight
          size={15}
          strokeWidth={1.8}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </section>
  );
}
