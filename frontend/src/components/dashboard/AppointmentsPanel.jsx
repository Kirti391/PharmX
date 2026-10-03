import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock } from "lucide-react";

import { Eyebrow } from "./DashboardPrimitives";
import {
  formatClock,
  formatStamp,
  modeLabel,
  partnerOf,
  safeDate,
} from "./dashboardData";

/* =========================================================
   PHARMUNIS — APPOINTMENTS PANEL
   Dark editorial block listing today's (or next) meetings.
========================================================= */

const DARK = {
  background: "#241B3F",
  hairline: "rgba(255,255,255,0.12)",
  time: "#F0A79D",
  name: "#FFFFFF",
  detail: "rgba(255,255,255,0.55)",
};

export function AppointmentsPanel({
  appointments = [],
  eyebrow = "Today",
  title = "Your appointments",
  showDate = false,
}) {
  return (
    <section
      className="rounded-[16px] px-6 py-7 transition-colors duration-300 sm:px-8 sm:py-8"
      style={{ backgroundColor: DARK.background }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow color="rgba(255,255,255,0.45)">{eyebrow}</Eyebrow>

          <h2
            className="mt-2 font-editorial text-[21px] font-semibold leading-tight sm:text-[23px]"
            style={{ color: DARK.name }}
          >
            {title}
          </h2>
        </div>

        <Link
          to="/appointments"
          className="
            inline-flex items-center gap-2 rounded-full border px-4 py-2
            font-nav text-[9px] uppercase tracking-[0.16em] text-white
            transition-all duration-200 hover:border-[#E98074] hover:bg-[#E98074]
          "
          style={{ borderColor: DARK.hairline }}
        >
          All appointments
          <ArrowUpRight size={13} strokeWidth={1.8} />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div
          className="mt-6 flex items-center gap-3 border-t pt-6"
          style={{ borderColor: DARK.hairline }}
        >
          <CalendarClock
            size={18}
            strokeWidth={1.5}
            style={{ color: DARK.time }}
          />

          <p
            className="font-body text-[11.5px] leading-5"
            style={{ color: DARK.detail }}
          >
            No meetings are scheduled. Book a slot from a
            connection to plan your next supplier conversation.
          </p>
        </div>
      ) : (
        <div className="mt-6 border-t" style={{ borderColor: DARK.hairline }}>
          {appointments.map((appointment) => {
            const date = safeDate(appointment.scheduledAt);

            return (
              <Link
                key={appointment.id}
                to={`/appointments/${appointment.id}`}
                className="group flex items-center gap-4 border-b py-4"
                style={{ borderColor: DARK.hairline }}
              >
                <span
                  className="w-[74px] shrink-0 font-nav text-[11px] tracking-[0.06em]"
                  style={{ color: DARK.time }}
                >
                  {showDate && date
                    ? formatStamp(date)
                    : formatClock(appointment.scheduledAt)}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate font-body text-[12.5px]"
                    style={{ color: DARK.name }}
                  >
                    {partnerOf(appointment)}
                  </span>

                  <span
                    className="mt-1 block truncate font-body text-[10.5px]"
                    style={{ color: DARK.detail }}
                  >
                    {[modeLabel(appointment.mode), appointment.notes]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  strokeWidth={1.7}
                  className="shrink-0 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                  style={{ color: DARK.detail }}
                />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
