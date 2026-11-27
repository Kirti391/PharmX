import { Link } from "react-router-dom";
import { ArrowRight, PackageSearch } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { Eyebrow } from "./DashboardPrimitives";
import RequirementSummaryCard from "../requirements/RequirementSummaryCard";

/* =========================================================
   PHARMUNIS — PROCUREMENT REQUIREMENTS
   The three most recent requirements as numbered cards.
========================================================= */

const MAX_CARDS = 3;

function SectionHeader({ isMR = false, isCompany = false }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: SURFACE.pinkSoft, color: SURFACE.pink }}
        >
          <PackageSearch size={20} strokeWidth={1.6} />
        </span>
        <div>
          <Eyebrow color={SURFACE.pink}>
            {isMR
              ? "Pharmacy demand"
              : isCompany
                ? "Partner demand"
                : "Procurement"}
          </Eyebrow>
          <h2
            className="mt-1 font-editorial text-[21px] font-semibold leading-tight sm:text-[24px]"
            style={{ color: SURFACE.ink }}
          >
            {isMR
              ? "Pharmacy requests for you"
              : isCompany
                ? "Partner requests for your company"
                : "Requirements"}
          </h2>
        </div>
      </div>

      <Link
        to="/requirements"
        className="group inline-flex min-h-10 items-center gap-2 rounded-full border px-4 font-nav text-[9.5px] uppercase tracking-[0.13em] transition-all hover:-translate-y-0.5 hover:shadow-sm"
        style={{
          borderColor: SURFACE.hairline,
          color: SURFACE.pink,
        }}
      >
        {isMR
          ? "Browse requests"
          : isCompany
            ? "View partner requests"
            : "All requirements"}
        <ArrowRight
          size={13}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

function StartWorkspacePanel({ isMR = false, isCompany = false }) {
  if (isMR) {
    return (
      <div
        className="rounded-[16px] px-6 py-7 sm:px-8 sm:py-8"
        style={{ backgroundColor: SURFACE.lavender }}
      >
        <PackageSearch
          size={24}
          strokeWidth={1.5}
          style={{ color: SURFACE.purple }}
        />
        <h3
          className="mt-4 font-editorial text-[20px] font-semibold"
          style={{ color: SURFACE.ink }}
        >
          No pharmacy requests for you yet.
        </h3>
        <p
          className="mt-3 max-w-xl font-body text-[11px] leading-6"
          style={{ color: SURFACE.inkSoft }}
        >
          Requests with a therapeutic area and support type appear here. Older
          requests stay hidden until the pharmacy updates them to the current
          support format.
        </p>
      </div>
    );
  }

  if (isCompany) {
    return (
      <div
        className="rounded-[16px] px-6 py-7 sm:px-8 sm:py-8"
        style={{ backgroundColor: SURFACE.lavender }}
      >
        <PackageSearch
          size={24}
          strokeWidth={1.5}
          style={{ color: SURFACE.purple }}
        />
        <h3
          className="mt-4 font-editorial text-[20px] font-semibold"
          style={{ color: SURFACE.ink }}
        >
          No partner requests yet.
        </h3>
        <p
          className="mt-3 max-w-xl font-body text-[11px] leading-6"
          style={{ color: SURFACE.inkSoft }}
        >
          Pharmacy and distributor requests addressed to your company will
          appear here. To recruit representatives or expand distribution, post
          an opportunity.
        </p>
        <Link
          to="/opportunities/create"
          className="group mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-nav text-[9px] uppercase tracking-[0.1em] text-white transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_26px_rgba(68,49,141,0.24)]"
          style={{ backgroundColor: SURFACE.purple }}
        >
          Create an opportunity
          <ArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </Link>
      </div>
    );
  }

  return (
    <div
      className="rounded-[16px] px-6 py-7 sm:px-8 sm:py-8"
      style={{ backgroundColor: SURFACE.lavender }}
    >
      <PackageSearch
        size={24}
        strokeWidth={1.5}
        style={{ color: SURFACE.purple }}
      />

      <h3
        className="mt-4 font-editorial text-[20px] font-semibold"
        style={{ color: SURFACE.ink }}
      >
        Start your procurement workspace.
      </h3>

      <p
        className="mt-3 max-w-xl font-body text-[11px] leading-6"
        style={{ color: SURFACE.inkSoft }}
      >
        Tell suppliers what your pharmacy needs. Every requirement
        becomes the starting point for responses, conversations and
        professional connections.
      </p>

      <Link
        to="/requirements/create"
        className="
          group mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3
          font-nav text-[9px] uppercase tracking-[0.1em] text-white transition-all
          duration-200 hover:-translate-y-[1px]
          hover:shadow-[0_12px_26px_rgba(68,49,141,0.24)]
        "
        style={{ backgroundColor: SURFACE.purple }}
      >
        Create requirement
        <ArrowRight
          size={15}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

function NoResultsPanel({ query, isMR = false, isCompany = false }) {
  return (
    <div
      className="rounded-[16px] border px-7 py-8"
      style={{ borderColor: SURFACE.hairline }}
    >
      <p
        className="font-body text-[12.5px] leading-6"
        style={{ color: SURFACE.inkSoft }}
      >
        {isMR
          ? `No pharmacy requests match "${query}". Try a different category, territory or status.`
          : isCompany
            ? `No partner requests match "${query}". Try a different category, territory or status.`
              : `No requirements match "${query}". Try a different category, supplier or status.`}
      </p>
    </div>
  );
}

export function RequirementsSection({
  requirements = [],
  query = "",
  role = "PHARMACY",
}) {
  const isMR = role === "MR";
  const isCompany = role === "PHARMA_COMPANY";
  const visible = requirements.slice(0, MAX_CARDS);

  return (
    <section
      className="rounded-[20px] border bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-7"
      style={{ borderColor: SURFACE.hairline }}
    >
      <SectionHeader isMR={isMR} isCompany={isCompany} />

      <div className="mt-5 border-t pt-5 sm:mt-6 sm:pt-6" style={{ borderColor: SURFACE.hairline }}>
        {requirements.length === 0 ? (
          query ? (
            <NoResultsPanel
              query={query}
              isMR={isMR}
              isCompany={isCompany}
            />
          ) : (
            <StartWorkspacePanel isMR={isMR} isCompany={isCompany} />
          )
        ) : (
          <div className="space-y-3">
            {visible.map((requirement) => (
              <RequirementSummaryCard
                key={requirement.id}
                requirement={requirement}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
