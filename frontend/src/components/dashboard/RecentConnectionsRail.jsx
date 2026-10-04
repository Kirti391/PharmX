import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Users } from "lucide-react";

import { SURFACE, accentFor } from "./dashboardTheme";
import { EmptyRow } from "./DashboardPrimitives";
import { initials, partnerOf, partnerRoleOf } from "./dashboardData";

/* =========================================================
   PHARMUNIS — RECENT CONNECTIONS RAIL
   The pharmacy's newest accepted professional connections.
========================================================= */

export function RecentConnectionsRail({ connections = [] }) {
  return (
    <section
      className="rounded-[22px] border bg-white p-5 shadow-[0_10px_30px_rgba(42,27,61,0.04)] sm:p-6"
      style={{ borderColor: SURFACE.hairline }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="workspace-label" style={{ color: SURFACE.purple }}>Your network</p>
          <h2
            className="mt-1 font-editorial text-[19px] font-semibold"
            style={{ color: SURFACE.ink }}
          >
            Recent connections
          </h2>
        </div>

        <Link
          to="/connections"
          className="font-nav text-[9px] uppercase tracking-[0.14em] transition-colors hover:text-[#44318D]"
          style={{ color: SURFACE.pink }}
        >
          View all
        </Link>
      </div>

      {connections.length === 0 ? (
        <EmptyRow icon={Users}>
          No connections yet. Discover companies and medical
          representatives to start building your network.
        </EmptyRow>
      ) : (
        <div className="mt-3">
          {connections.slice(0, 4).map((connection, index) => {
            const name = partnerOf(connection);

            return (
              <Link
                key={connection.id}
                to="/connections"
                className="group flex items-center gap-3 border-b py-3.5 last:border-b-0"
                style={{ borderColor: SURFACE.hairline }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] font-nav text-[10px] text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                  style={{ background: `linear-gradient(145deg, ${accentFor(index)}, ${SURFACE.purple})` }}
                >
                  {initials(name)}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate font-body text-[12px]"
                    style={{ color: SURFACE.ink }}
                  >
                    {name}
                  </span>

                  <span
                    className="mt-0.5 block truncate font-body text-[10px]"
                    style={{ color: SURFACE.inkMuted }}
                  >
                    {partnerRoleOf(connection)}
                  </span>
                </span>

                <ArrowRight
                  size={15}
                  strokeWidth={1.7}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  style={{ color: SURFACE.inkMuted }}
                />
              </Link>
            );
          })}

          <Link
            to="/discover/companies"
            className="mt-4 inline-flex items-center gap-2 font-nav text-[9px] uppercase tracking-[0.14em] transition-colors hover:text-[#44318D]"
            style={{ color: SURFACE.purple }}
          >
            Find more partners
            <ArrowUpRight size={13} strokeWidth={1.8} />
          </Link>
        </div>
      )}
    </section>
  );
}
