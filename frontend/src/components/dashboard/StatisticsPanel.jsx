import { SURFACE } from "./dashboardTheme";
import { PanelHeading } from "./DashboardPrimitives";

/* =========================================================
   PHARMUNIS — PHARMACY STATISTICS
   Four live counters rendered as an editorial 2×2 grid.
========================================================= */

const TILES = [
  {
    key: "requirements",
    label: "Requirements",
    color: SURFACE.pink,
  },
  {
    key: "connections",
    label: "Connections",
    color: SURFACE.purple,
  },
  {
    key: "appointments",
    label: "Appointments",
    color: SURFACE.coral,
  },
  {
    key: "notifications",
    label: "Notifications",
    color: SURFACE.ink,
  },
];

function formatCount(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) return "00";

  return String(Math.trunc(number)).padStart(2, "0");
}

export function StatisticsPanel({ stats = {} }) {
  const values = {
    requirements: stats.openRequirements ?? 0,
    connections: stats.connections ?? 0,
    appointments: stats.upcomingAppointments ?? 0,
    notifications: stats.unreadNotifications ?? 0,
  };

  return (
    <section className="min-w-0">
      <PanelHeading
        eyebrow="Overview"
        eyebrowColor={SURFACE.purple}
        title="Pharmacy statistics"
      />

      <div
        className="mt-5 grid grid-cols-2 border-t border-l"
        style={{ borderColor: SURFACE.hairline }}
      >
        {TILES.map((tile) => (
          <div
            key={tile.key}
            className="group relative border-b border-r px-4 py-5 transition-colors duration-200 hover:bg-[#FBFAFC] sm:px-5 sm:py-6"
            style={{ borderColor: SURFACE.hairline }}
          >
            <span
              className="block h-[3px] w-7 rounded-full transition-all duration-300 group-hover:w-12"
              style={{ backgroundColor: tile.color }}
            />

            <p
              className="mt-4 font-editorial text-[28px] font-semibold leading-none sm:text-[32px]"
              style={{ color: SURFACE.ink }}
            >
              {formatCount(values[tile.key])}
            </p>

            <p
              className="workspace-label mt-2.5"
              style={{ color: SURFACE.inkMuted }}
            >
              {tile.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
