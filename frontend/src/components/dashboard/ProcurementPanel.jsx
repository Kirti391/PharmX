import { Link } from "react-router-dom";
import { Activity } from "lucide-react";

import { SURFACE } from "./dashboardTheme";
import {
  EmptyRow,
  PanelHeading,
} from "./DashboardPrimitives";

/* =========================================================
   PHARMUNIS — TODAY'S PROCUREMENT
   Live activity built from today's appointments and the
   most recently created requirements.
========================================================= */

export function ProcurementPanel({ items = [] }) {
  return (
    <section
      className="min-w-0 rounded-[22px] border bg-white p-5 shadow-[0_10px_30px_rgba(42,27,61,0.04)] sm:p-6"
      style={{
        borderColor: SURFACE.hairline,
        background: "linear-gradient(155deg, #FFFFFF 0%, #FFFCFA 100%)",
      }}
    >
      <PanelHeading
        eyebrow="Activity"
        eyebrowColor={SURFACE.coral}
        title="Today's procurement"
        action={
          <Link
            to="/requirements"
            className="font-nav text-[10px] uppercase tracking-[0.14em] transition-colors hover:text-[#44318D]"
            style={{ color: SURFACE.pink }}
          >
            View all
          </Link>
        }
      />

      <div className="mt-4">
        {items.length === 0 ? (
          <EmptyRow icon={Activity}>
            Nothing is scheduled or posted yet today. New
            supplier activity will appear here.
          </EmptyRow>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-3.5 border-b py-4 last:border-b-0"
              style={{ borderColor: SURFACE.hairline }}
            >
              <span
                className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${item.accent}18`, color: item.accent }}
              >
                <Activity size={14} strokeWidth={1.7} />
              </span>

              <div className="min-w-0">
                <p
                  className="font-body text-[12.5px] leading-5"
                  style={{ color: SURFACE.ink }}
                >
                  {item.title}
                </p>

                <p
                  className="workspace-label mt-1.5"
                  style={{ color: SURFACE.inkMuted }}
                >
                  {item.meta}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
