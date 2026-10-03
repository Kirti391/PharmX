import { Link } from "react-router-dom";
import { Bell, Plus } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { Eyebrow, ScriptLine } from "./DashboardPrimitives";

/* =========================================================
   PHARMUNIS — DASHBOARD HERO
   Editorial greeting, live workspace summary and actions.
========================================================= */

export function DashboardHero({
  pharmacyName,
  summary,
  hasUnread = false,
}) {
  return (
    <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Eyebrow color={SURFACE.inkMuted}>Pharmacy workspace</Eyebrow>

        <h1
          className="
            mt-3 font-editorial font-semibold uppercase
            text-[30px] leading-[1.06] tracking-[-0.01em]
            sm:text-[38px] lg:text-[44px]
          "
          style={{ color: SURFACE.ink }}
        >
          Hello, {pharmacyName}
        </h1>

        <ScriptLine
          className="mt-4 text-[17px] sm:text-[18px]"
          color={SURFACE.inkSoft}
        >
          {summary}
        </ScriptLine>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="
            relative flex h-11 w-11 items-center justify-center rounded-full
            border bg-white transition-all duration-200
            hover:-translate-y-[1px]
          "
          style={{ borderColor: SURFACE.hairline, color: SURFACE.ink }}
        >
          <Bell size={17} strokeWidth={1.6} />

          {hasUnread && (
            <span
              className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: SURFACE.coral }}
            />
          )}
        </Link>

        <Link
          to="/requirements/create"
          className="
            group flex h-11 items-center gap-2.5 rounded-full px-5
            text-white transition-all duration-200
            hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(216,63,135,0.28)]
          "
          style={{ backgroundColor: SURFACE.pink }}
        >
          <Plus
            size={16}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:rotate-90"
          />

          <span className="font-script text-[17px] leading-none">
            New requirement
          </span>
        </Link>
      </div>
    </header>
  );
}
