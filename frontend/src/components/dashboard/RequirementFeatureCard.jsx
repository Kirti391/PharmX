import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { statusLabel, urgencyLabel } from "./dashboardTheme";
import { formatStamp, safeDate } from "./dashboardData";
import { isToday } from "date-fns";

/* =========================================================
   PHARMUNIS — FEATURED REQUIREMENT CARD
   Numbered, editorial card used for the three most recent
   procurement requirements.
========================================================= */

const VARIANTS = {
  dark: {
    background: "#241B3F",
    hoverBackground: "#2E2350",
    title: "#FFFFFF",
    script: "rgba(255,255,255,0.74)",
    label: "rgba(255,255,255,0.52)",
    number: "#FFFFFF",
    arrowBorder: "rgba(255,255,255,0.24)",
    arrowColor: "#FFFFFF",
    edge: "transparent",
  },
  lavender: {
    background: SURFACE.lavender,
    hoverBackground: "#E4E0F4",
    title: SURFACE.ink,
    script: SURFACE.inkSoft,
    label: SURFACE.inkMuted,
    number: SURFACE.ink,
    arrowBorder: "rgba(42,27,61,0.14)",
    arrowColor: SURFACE.ink,
    edge: SURFACE.ink,
  },
  peach: {
    background: SURFACE.peach,
    hoverBackground: "#F8D8CF",
    title: SURFACE.ink,
    script: SURFACE.inkSoft,
    label: SURFACE.inkMuted,
    number: SURFACE.ink,
    arrowBorder: "rgba(233,128,116,0.35)",
    arrowColor: SURFACE.ink,
    edge: SURFACE.coral,
  },
};

const VARIANT_ORDER = ["dark", "lavender", "peach"];

function postedLabel(value) {
  const date = safeDate(value);

  if (!date) return "Not dated";

  return isToday(date)
    ? `Posted today, ${formatStamp(date)}`
    : `Posted ${formatStamp(date)}`;
}

export function RequirementFeatureCard({
  requirement,
  index = 0,
  variant,
}) {
  const palette =
    VARIANTS[variant || VARIANT_ORDER[index % VARIANT_ORDER.length]] ||
    VARIANTS.dark;

  const ordinal = String(index + 1).padStart(2, "0");

  const status = statusLabel(requirement?.status);

  const meta = [
    urgencyLabel(requirement?.urgency),
    status,
    postedLabel(requirement?.createdAt),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/requirements/${requirement?.id}`}
      className="
        group relative block overflow-hidden rounded-[14px]
        transition-all duration-300 hover:-translate-y-[3px]
        hover:shadow-[0_18px_38px_rgba(42,27,61,0.14)]
      "
      style={{ backgroundColor: palette.background }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor =
          palette.hoverBackground;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor =
          palette.background;
      }}
    >
      {palette.edge !== "transparent" && (
        <span
          className="absolute inset-y-0 left-0 w-[4px]"
          style={{ backgroundColor: palette.edge }}
        />
      )}

      <div
        className="
          flex flex-col gap-4 px-6 py-6
          sm:grid sm:grid-cols-[86px_minmax(0,1fr)_44px] sm:items-center
          sm:gap-6 sm:py-7
        "
      >
        {/* Ordinal */}

        <div className="flex items-end gap-2 sm:block">
          <p
            className="font-editorial text-[26px] font-semibold leading-none"
            style={{ color: palette.number }}
          >
            {ordinal}
          </p>

          <p
            className="workspace-label sm:mt-2"
            style={{ color: palette.label }}
          >
            Requirement {ordinal}
          </p>
        </div>

        {/* Content */}

        <div className="min-w-0 text-left sm:text-center">
          <h3
            className="font-editorial text-[17px] font-semibold leading-snug sm:text-[19px]"
            style={{ color: palette.title }}
          >
            {requirement?.title || "Untitled requirement"}
          </h3>

          <p
            className="mt-2 truncate font-script text-[16px] leading-7 sm:mx-auto sm:max-w-[560px]"
            style={{ color: palette.script }}
          >
            {requirement?.description || "No description added yet."}
          </p>

          <p
            className="workspace-label mt-3"
            style={{ color: palette.label }}
          >
            {meta}
          </p>
        </div>

        {/* Arrow */}

        <span
          className="
            hidden h-11 w-11 shrink-0 items-center justify-center rounded-full
            border transition-transform duration-300 group-hover:translate-x-1
            group-hover:-translate-y-1 sm:flex
          "
          style={{
            borderColor: palette.arrowBorder,
            color: palette.arrowColor,
          }}
        >
          <ArrowUpRight size={17} strokeWidth={1.7} />
        </span>
      </div>
    </Link>
  );
}
