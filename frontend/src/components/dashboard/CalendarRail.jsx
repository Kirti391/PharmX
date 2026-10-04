import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";

import { SURFACE } from "./dashboardTheme";
import { Eyebrow, EmptyRow } from "./DashboardPrimitives";
import {
  formatClock,
  formatStamp,
  modeLabel,
  partnerOf,
  safeDate,
} from "./dashboardData";

/* =========================================================
   PHARMUNIS — SCHEDULE RAIL
   Month calendar plus the upcoming appointment list.
========================================================= */

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarRail({ appointments = [] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      }),
    [month]
  );

  const scheduledDates = useMemo(
    () =>
      appointments
        .map((item) => safeDate(item.scheduledAt))
        .filter(Boolean),
    [appointments]
  );

  function shiftMonth(offset) {
    setMonth((current) => {
      const next = new Date(current);

      next.setMonth(next.getMonth() + offset);

      return next;
    });
  }

  return (
    <section
      className="rounded-[22px] border bg-white px-5 py-6 shadow-[0_10px_30px_rgba(42,27,61,0.04)] sm:px-6"
      style={{ borderColor: SURFACE.hairline }}
    >
      {/* =================================================
          CALENDAR
      ================================================= */}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: SURFACE.coralSoft, color: SURFACE.coral }}>
            <CalendarDays size={16} strokeWidth={1.7} />
          </span>
          <h2
            className="font-editorial text-[19px] font-semibold"
            style={{ color: SURFACE.ink }}
          >
            {format(month, "MMMM yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#FDEBF4] hover:text-[#D83F87]"
            style={{ color: SURFACE.inkMuted }}
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[#FDEBF4] hover:text-[#D83F87]"
            style={{ color: SURFACE.inkMuted }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="workspace-label pb-2"
            style={{ color: SURFACE.inkMuted }}
          >
            {day}
          </span>
        ))}

        {days.map((day) => {
          const isSelected = isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());

          const hasMeeting = scheduledDates.some((date) =>
            isSameDay(date, day)
          );

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              aria-label={format(day, "dd MMMM yyyy")}
              aria-pressed={isSelected}
              className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-[13px] font-body text-[11.5px] transition-all duration-200 hover:bg-[#F6F4F9]"
              style={{
                backgroundColor: isSelected ? SURFACE.pink : isToday ? SURFACE.purpleSoft : "transparent",
                color: isSelected
                  ? "#FFFFFF"
                  : isSameMonth(day, month)
                    ? SURFACE.ink
                    : SURFACE.inkMuted,
                fontWeight: isToday && !isSelected ? 600 : 400,
              }}
            >
              {format(day, "d")}

              {hasMeeting && !isSelected && (
                <span
                  className="absolute bottom-1 h-[3px] w-[3px] rounded-full"
                  style={{ backgroundColor: SURFACE.coral }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* =================================================
          UPCOMING APPOINTMENTS
      ================================================= */}

      <div
        className="mt-6 border-t pt-5"
        style={{ borderColor: SURFACE.hairline }}
      >
        <Eyebrow color={SURFACE.coral}>Upcoming</Eyebrow>

        <div className="mt-2 flex items-end justify-between gap-3">
          <h2
            className="font-editorial text-[19px] font-semibold"
            style={{ color: SURFACE.ink }}
          >
            Appointments
          </h2>

          <Link
            to="/appointments"
            className="font-nav text-[9px] uppercase tracking-[0.14em] transition-colors hover:text-[#44318D]"
            style={{ color: SURFACE.pink }}
          >
            View all
          </Link>
        </div>

        {appointments.length === 0 ? (
          <EmptyRow icon={CalendarDays}>
            No upcoming meetings. Connect with a supplier to
            schedule your first appointment.
          </EmptyRow>
        ) : (
          <div className="mt-4">
            {appointments.slice(0, 5).map((appointment) => (
              <Link
                key={appointment.id}
                to={`/appointments/${appointment.id}`}
                className="group flex items-start gap-3 border-b py-4"
                style={{ borderColor: SURFACE.hairline }}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className="inline-flex rounded-full px-2 py-1 font-nav text-[8px] uppercase tracking-[0.1em]"
                    style={{ backgroundColor: SURFACE.coralSoft, color: SURFACE.coral }}
                  >
                    {formatStamp(appointment.scheduledAt)} ·{" "}
                    {formatClock(appointment.scheduledAt)}
                  </span>

                  <span
                    className="mt-2 block truncate font-body text-[12.5px] leading-5"
                    style={{ color: SURFACE.ink }}
                  >
                    {partnerOf(appointment)}
                  </span>

                  <span
                    className="mt-1 block truncate font-body text-[10.5px]"
                    style={{ color: SURFACE.inkMuted }}
                  >
                    {modeLabel(appointment.mode)}
                  </span>
                </span>

                <ArrowUpRight
                  size={15}
                  strokeWidth={1.7}
                  className="mt-1 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                  style={{ color: SURFACE.inkMuted }}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
