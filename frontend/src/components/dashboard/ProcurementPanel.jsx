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
    <section className="min-w-0">
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

      <div className="mt-5">
        {items.length === 0 ? (
          <EmptyRow icon={Activity}>
            Nothing is scheduled or posted yet today. New
            supplier activity will appear here.
          </EmptyRow>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-3.5 border-b py-4"
              style={{ borderColor: SURFACE.hairline }}
            >
              <span
                className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full transition-transform duration-200 group-hover:scale-150"
                style={{ backgroundColor: item.accent }}
              />

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
