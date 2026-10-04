import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

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
      className="relative overflow-hidden rounded-[18px] border px-5 py-6 sm:px-6"
      style={{
        borderColor: "#F1D8D0",
        background: "linear-gradient(135deg, #FCF4F0 0%, #FBE4DE 100%)",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80" style={{ color: SURFACE.coral }}>
          <ShieldCheck size={19} strokeWidth={1.7} />
        </span>
        <div className="min-w-0">
          <p className="font-nav text-[9px] uppercase tracking-[0.14em]" style={{ color: SURFACE.coral }}>
            Trust & verification
          </p>
          <h2
            className="mt-1 max-w-[220px] font-editorial text-[18px] font-semibold leading-snug"
            style={{ color: SURFACE.ink }}
          >
            Complete your pharmacy verification.
          </h2>
        </div>
      </div>

      <p
        className="mt-3 font-body text-[11px] leading-6"
        style={{ color: SURFACE.inkSoft }}
      >
        {copy.body}
      </p>

      <Link
        to="/verification"
        className="group mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 font-nav text-[9px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_10px_22px_rgba(42,27,61,0.14)]"
        style={{ backgroundColor: SURFACE.purple }}
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
