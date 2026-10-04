import { Link } from "react-router-dom";
import { ClipboardList, MessageSquare, Search, X } from "lucide-react";

import { SURFACE } from "./dashboardTheme";

/* =========================================================
   PHARMUNIS — WORKSPACE SEARCH
   Filters the workspace panels in place, plus quick links
   into the two most used workspaces.
========================================================= */

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="group flex h-12 shrink-0 items-center gap-2.5 rounded-xl border bg-white px-4 transition-all duration-200 hover:border-[#D83F87]/35 hover:shadow-sm sm:px-5"
      style={{ borderColor: SURFACE.hairline }}
    >
      <Icon
        size={16}
        strokeWidth={1.6}
        className="shrink-0 transition-colors duration-200 group-hover:text-[#44318D]"
        style={{ color: SURFACE.inkMuted }}
      />

      <span
        className="whitespace-nowrap font-nav text-[9px] uppercase tracking-[0.1em] transition-colors duration-200 group-hover:text-[#44318D]"
        style={{ color: SURFACE.ink }}
      >
        {label}
      </span>
    </Link>
  );
}

export function WorkspaceSearch({
  value,
  onChange,
  onClear,
  resultCount = null,
}) {
  return (
    <div className="rounded-[18px] border bg-[#F7F5FA] p-3 sm:p-3.5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border bg-white px-4 transition-colors duration-200 focus-within:border-[#D83F87]/45 sm:px-5"
          style={{ borderColor: SURFACE.hairline }}
        >
          <Search
            size={17}
            strokeWidth={1.6}
            className="shrink-0"
            style={{ color: SURFACE.inkMuted }}
          />

          <input
            type="search"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search requirements, suppliers or connections"
            aria-label="Search the pharmacy workspace"
            className="
            h-full min-w-0 flex-1 bg-transparent font-body text-[12px]
            outline-none placeholder:text-[#A9A1B4]
          "
            style={{ color: SURFACE.ink }}
          />

          {value && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear search"
              className="shrink-0 rounded-full p-1 transition-colors hover:bg-[#FDEBF4] "
              style={{ color: SURFACE.inkMuted }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <QuickLink
            to="/requirements"
            icon={ClipboardList}
            label="My requirements"
          />

          <QuickLink
            to="/messages"
            icon={MessageSquare}
            label="My messages"
          />
        </div>

        {value && resultCount !== null && (
          <p
            className="shrink-0 font-body text-[11px] lg:pl-1"
            style={{ color: SURFACE.inkMuted }}
          >
            {resultCount} {resultCount === 1 ? "match" : "matches"}
          </p>
        )}
      </div>
    </div>
  );
}
