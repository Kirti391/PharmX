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
      className="relative isolate overflow-hidden rounded-[22px] border px-6 py-7 shadow-[0_10px_28px_rgba(68,49,141,0.08)]"
      style={{
        borderColor: "#DDD7EF",
        background: "linear-gradient(140deg, #EFEBF9 0%, #F9F3FA 62%, #FBE4DE 100%)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -right-9 -top-10 -z-10 h-32 w-32 rounded-full border-[18px] border-white/50"
      />
      <span className="absolute right-7 top-7 h-2 w-2 rounded-full" style={{ backgroundColor: SURFACE.pink }} />

      <h2
        className="max-w-[210px] font-editorial text-[19px] font-semibold leading-snug"
        style={{ color: SURFACE.ink }}
      >
        Build stronger pharmaceutical partnerships.
      </h2>

      <p
        className="mt-3 font-body text-[11px] leading-6"
        style={{ color: SURFACE.inkSoft }}
      >
        Explore verified companies, distributors and medical
        representatives across your territory.
      </p>

      <Link
        to="/discover/companies"
        className="
          group mt-5 inline-flex items-center gap-2 rounded-full bg-white/90
          px-5 py-3 font-nav text-[9px] uppercase tracking-[0.1em] transition-all
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
