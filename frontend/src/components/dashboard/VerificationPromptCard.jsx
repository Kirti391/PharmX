import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SURFACE } from "./dashboardTheme";

/* =========================================================
   PHARMUNIS — VERIFICATION PROMPT
   Peach card nudging the pharmacy to finish verification.
========================================================= */

const STATUS_COPY = {
  PENDING: {
    body: "Your documents are with our team. Verification unlocks trust badges for your profile.",
    action: "Track verification",
  },
  ACTION_REQUIRED: {
    body: "A document needs attention before your pharmacy can be verified.",
    action: "Review documents",
  },
  NOT_SUBMITTED: {
    body: "Add your pharmacy and licensing documents so professional partners can trust your profile.",
    action: "Complete verification",
  },
};

export function VerificationPromptCard({ status }) {
  const copy =
    STATUS_COPY[String(status || "").toUpperCase()] ||
    STATUS_COPY.NOT_SUBMITTED;

  return (
    <section
      className="rounded-[16px] px-6 py-7"
      style={{ backgroundColor: SURFACE.peach }}
    >
      <h2
        className="max-w-[220px] font-editorial text-[19px] font-semibold leading-snug"
        style={{ color: SURFACE.ink }}
      >
        Complete your pharmacy verification.
      </h2>

      <p
        className="mt-3 font-script text-[16px] leading-7"
        style={{ color: SURFACE.inkSoft }}
      >
        {copy.body}
      </p>

      <Link
        to="/verification"
        className="
          group mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3
          font-script text-[16px] leading-none transition-all duration-200
          hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(42,27,61,0.10)]
        "
        style={{ color: SURFACE.ink }}
      >
        {copy.action}
        <ArrowRight
          size={15}
          strokeWidth={1.8}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </section>
  );
}
