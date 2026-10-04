import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3 } from "lucide-react";

import {
  SURFACE,
  statusColor,
  statusLabel,
  urgencyLabel,
} from "./dashboardTheme";
import { formatStamp, safeDate } from "./dashboardData";
import { isToday } from "date-fns";

const VARIANTS = {
  dark: {
    accent: SURFACE.pink,
    numberBackground: SURFACE.pinkSoft,
  },
  lavender: {
    accent: SURFACE.purple,
    numberBackground: SURFACE.purpleSoft,
  },
  peach: {
    accent: SURFACE.coral,
    numberBackground: SURFACE.coralSoft,
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

  const meta = postedLabel(requirement?.createdAt);

  return (
    <Link
      to={`/requirements/${requirement?.id}`}
      className="
        group relative block overflow-hidden rounded-[15px] border
        transition-all duration-200 hover:-translate-y-0.5
        hover:shadow-[0_12px_26px_rgba(42,27,61,0.08)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D83F87]
      "
      style={{ borderColor: SURFACE.hairline, backgroundColor: SURFACE.paper }}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: palette.accent }}
      />

      <div
        className="
          flex items-start gap-3.5 px-4 py-4 pl-5
          sm:grid sm:grid-cols-[54px_minmax(0,1fr)_40px] sm:items-center
          sm:gap-4 sm:px-5 sm:py-[18px]
        "
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: palette.numberBackground }}
        >
          <p
            className="font-editorial text-[17px] font-semibold leading-none"
            style={{ color: palette.accent }}
          >
            {ordinal}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="min-w-0 font-editorial text-[15px] font-semibold leading-snug transition-colors group-hover:text-[#D83F87] sm:text-[16px]"
              style={{ color: SURFACE.ink }}
            >
              {requirement?.title || "Untitled requirement"}
            </h3>
            <span
              className="rounded-full px-2.5 py-1 font-nav text-[8px] uppercase tracking-[0.1em]"
              style={{
                backgroundColor: `${statusColor(requirement?.status)}14`,
                color: statusColor(requirement?.status),
              }}
            >
              {status}
            </span>
            {requirement?.urgency && (
              <span
                className="rounded-full px-2.5 py-1 font-nav text-[8px] uppercase tracking-[0.1em]"
                style={{
                  backgroundColor: SURFACE.navySoft,
                  color: SURFACE.inkSoft,
                }}
              >
                {urgencyLabel(requirement?.urgency)}
              </span>
            )}
          </div>

          <p
            className="mt-1.5 line-clamp-2 font-body text-[11px] leading-5 sm:text-xs"
            style={{ color: SURFACE.inkSoft }}
          >
            {requirement?.description || "No description added yet."}
          </p>

          <p
            className="mt-2 flex items-center gap-1.5 font-nav text-[9px] uppercase tracking-[0.08em]"
            style={{ color: SURFACE.inkMuted }}
          >
            <Clock3 size={12} strokeWidth={1.7} />
            {meta}
          </p>
        </div>

        <span
          className="
            hidden h-9 w-9 shrink-0 items-center justify-center rounded-full
            border transition-all duration-200 group-hover:translate-x-0.5
            group-hover:-translate-y-0.5 sm:flex
          "
          style={{
            borderColor: SURFACE.hairline,
            color: palette.accent,
          }}
        >
          <ArrowUpRight size={17} strokeWidth={1.7} />
        </span>
      </div>
    </Link>
  );
}
