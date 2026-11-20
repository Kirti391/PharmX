import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import { EmptyRow, PanelHeading } from "./DashboardPrimitives";

export function OpportunitySection({
  opportunities = [],
  companyDashboard = false,
}) {
  return (
    <section
      className="rounded-[20px] border bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.035)] sm:p-7"
      style={{ borderColor: SURFACE.hairline }}
    >
      <PanelHeading
        eyebrow={companyDashboard ? "Company pipeline" : "Professional growth"}
        eyebrowColor={SURFACE.purple}
        title={companyDashboard ? "Your open opportunities" : "Company opportunities"}
        action={
          <Link
            to={companyDashboard ? "/opportunities/create" : "/opportunities"}
            className="group inline-flex min-h-10 items-center gap-2 rounded-full border px-4 font-nav text-[9.5px] uppercase tracking-[0.13em] transition-all hover:-translate-y-0.5 hover:shadow-sm"
            style={{ borderColor: SURFACE.hairline, color: SURFACE.purple }}
          >
            {companyDashboard ? "Create opportunity" : "View all"}
            <ArrowRight
              size={13}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        }
      />

      <div className="mt-5 border-t pt-4 sm:mt-6 sm:pt-5" style={{ borderColor: SURFACE.hairline }}>
        {opportunities.length === 0 ? (
          <EmptyRow icon={BriefcaseBusiness}>
            {companyDashboard
              ? "Publish an opportunity to recruit representatives or expand your distribution network."
              : "No matching company opportunities are open right now. New roles will appear here as they become available."}
          </EmptyRow>
        ) : (
          <div className="divide-y" style={{ borderColor: SURFACE.hairline }}>
            {opportunities.slice(0, 3).map((opportunity) => (
              <Link
                key={opportunity.id}
                to={`/opportunities/${opportunity.id}`}
                className="group flex items-center justify-between gap-4 py-4 first:pt-1 last:pb-1"
              >
                <span className="min-w-0">
                  <span className="block truncate font-editorial text-sm font-semibold" style={{ color: SURFACE.ink }}>
                    {opportunity.title}
                  </span>
                  <span className="mt-1 block truncate font-body text-[10px]" style={{ color: SURFACE.inkMuted }}>
                    {[
                      ...(opportunity.categories || []),
                      ...(opportunity.territories || []),
                    ].join(" · ") || opportunity.type?.replaceAll("_", " ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  {opportunity.applicationStatus && (
                    <span
                      className="rounded-full px-2.5 py-1 font-nav text-[8px] uppercase tracking-[0.1em]"
                      style={{
                        backgroundColor: SURFACE.successSoft,
                        color: SURFACE.success,
                      }}
                    >
                      Applied
                    </span>
                  )}
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                    style={{ color: SURFACE.pink }}
                  />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
