import { Link } from "react-router-dom";
import { ArrowRight, PackageSearch } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { Eyebrow } from "./DashboardPrimitives";
import { RequirementFeatureCard } from "./RequirementFeatureCard";

/* =========================================================
   PHARMUNIS — PROCUREMENT REQUIREMENTS
   The three most recent requirements as numbered cards.
========================================================= */

const MAX_CARDS = 3;

function SectionHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Eyebrow color={SURFACE.pink}>Workspace</Eyebrow>

        <h2
          className="mt-2 font-editorial text-[24px] font-semibold leading-tight sm:text-[26px]"
          style={{ color: SURFACE.ink }}
        >
          Procurement requirements
        </h2>
      </div>

      <Link
        to="/requirements"
        className="group inline-flex items-center gap-2 font-nav text-[9.5px] uppercase tracking-[0.16em] transition-colors hover:text-[#44318D]"
        style={{ color: SURFACE.pink }}
      >
        All requirements
        <ArrowRight
          size={13}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

function StartWorkspacePanel() {
  return (
    <div
      className="rounded-[16px] px-7 py-8 sm:px-9 sm:py-10"
      style={{ backgroundColor: SURFACE.lavender }}
    >
      <PackageSearch
        size={22}
        strokeWidth={1.5}
        style={{ color: SURFACE.purple }}
      />

      <h3
        className="mt-5 font-editorial text-[22px] font-semibold"
        style={{ color: SURFACE.ink }}
      >
        Start your procurement workspace.
      </h3>

      <p
        className="mt-3 max-w-xl font-script text-[16px] leading-7"
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
          font-script text-[16px] leading-none text-white transition-all
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

function NoResultsPanel({ query }) {
  return (
    <div
      className="rounded-[16px] border px-7 py-8"
      style={{ borderColor: SURFACE.hairline }}
    >
      <p
        className="font-body text-[12.5px] leading-6"
        style={{ color: SURFACE.inkSoft }}
      >
        {`No requirements match "${query}". Try a different category, supplier or status.`}
      </p>
    </div>
  );
}

export function RequirementsSection({ requirements = [], query = "" }) {
  const visible = requirements.slice(0, MAX_CARDS);

  return (
    <section className="mt-10">
      <SectionHeader />

      <div className="mt-5">
        {requirements.length === 0 ? (
          query ? (
            <NoResultsPanel query={query} />
          ) : (
            <StartWorkspacePanel />
          )
        ) : (
          <div className="space-y-3">
            {visible.map((requirement, index) => (
              <RequirementFeatureCard
                key={requirement.id}
                requirement={requirement}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
