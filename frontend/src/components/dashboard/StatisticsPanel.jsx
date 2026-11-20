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
    background: SURFACE.pinkSoft,
  },
  {
    key: "connections",
    label: "Connections",
    color: SURFACE.purple,
    background: SURFACE.purpleSoft,
  },
  {
    key: "appointments",
    label: "Appointments",
    color: SURFACE.coral,
    background: SURFACE.coralSoft,
  },
  {
    key: "notifications",
    label: "Notifications",
    color: SURFACE.inkSoft,
    background: SURFACE.sectionCanvas,
  },
];

function formatCount(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) return "00";

  return String(Math.trunc(number)).padStart(2, "0");
}

export function StatisticsPanel({
  stats = {},
  title = "Pharmacy statistics",
  variant = "pharmacy",
}) {
  const isCompany = variant === "company";
  const isDoctor = variant === "doctor";
  const isStockist = variant === "stockist";
  const tiles = isCompany
    ? [
        {
          key: "opportunities",
          label: "Open opportunities",
          color: SURFACE.pink,
          background: SURFACE.pinkSoft,
        },
        {
          key: "authorizations",
          label: "MR authorization requests",
          color: SURFACE.purple,
          background: SURFACE.purpleSoft,
        },
        {
          key: "leads",
          label: "Open leads",
          color: SURFACE.coral,
          background: SURFACE.coralSoft,
        },
        {
          key: "followUps",
          label: "Follow-ups due",
          color: SURFACE.inkSoft,
          background: SURFACE.sectionCanvas,
        },
      ]
    : isStockist
      ? [
          {
            key: "requirements",
            label: "Open requirements",
            color: SURFACE.pink,
            background: SURFACE.pinkSoft,
          },
          {
            key: "opportunities",
            label: "Distribution opportunities",
            color: SURFACE.purple,
            background: SURFACE.purpleSoft,
          },
          {
            key: "connections",
            label: "Professional connections",
            color: SURFACE.coral,
            background: SURFACE.coralSoft,
          },
          {
            key: "leads",
            label: "Active leads",
            color: SURFACE.inkSoft,
            background: SURFACE.sectionCanvas,
          },
        ]
    : isDoctor
      ? [
          {
            key: "requests",
            label: "Requests to review",
            color: SURFACE.pink,
            background: SURFACE.pinkSoft,
          },
          {
            key: "appointments",
            label: "Upcoming appointments",
            color: SURFACE.purple,
            background: SURFACE.purpleSoft,
          },
          {
            key: "connections",
            label: "Connections",
            color: SURFACE.coral,
            background: SURFACE.coralSoft,
          },
          {
            key: "notifications",
            label: "Unread updates",
            color: SURFACE.inkSoft,
            background: SURFACE.sectionCanvas,
          },
        ]
      : TILES;
  const values = isCompany
    ? {
        opportunities: stats.openOpportunities ?? 0,
        authorizations: stats.pendingAuthorizations ?? 0,
        leads: stats.openLeads ?? 0,
        followUps: stats.dueFollowUps ?? 0,
      }
    : isStockist
      ? {
          requirements: stats.openRequirements ?? 0,
          opportunities: stats.openOpportunities ?? 0,
          connections: stats.connections ?? 0,
          leads: stats.openLeads ?? 0,
        }
    : isDoctor
      ? {
          requests: stats.pendingAppointments ?? 0,
          appointments: stats.upcomingAppointments ?? 0,
          connections: stats.connections ?? 0,
          notifications: stats.unreadNotifications ?? 0,
        }
      : {
          requirements: stats.openRequirements ?? 0,
          connections: stats.connections ?? 0,
          appointments: stats.upcomingAppointments ?? 0,
          notifications: stats.unreadNotifications ?? 0,
        };

  return (
    <section
      className="min-w-0 rounded-[18px] border bg-white p-5 shadow-[0_6px_22px_rgba(42,27,61,0.035)] sm:p-6"
      style={{ borderColor: SURFACE.hairline }}
    >
      <PanelHeading
        eyebrow="Overview"
        eyebrowColor={SURFACE.purple}
        title={title}
      />

      <div
        className="mt-5 grid grid-cols-2 gap-2.5"
        style={{ borderColor: SURFACE.hairline }}
      >
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="group relative min-h-[112px] overflow-hidden rounded-[14px] border p-4 transition-colors duration-200 hover:bg-[#FCFAF8] sm:p-5"
            style={{ borderColor: SURFACE.hairline }}
          >
            <span
              className="absolute -right-4 -top-5 h-16 w-16 rounded-full transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: tile.background }}
            />

            <p
              className="relative mt-1 font-editorial text-[28px] font-semibold leading-none sm:text-[32px]"
              style={{ color: SURFACE.ink }}
            >
              {formatCount(values[tile.key])}
            </p>

            <p
              className="relative mt-2 font-nav text-[9px] uppercase tracking-[0.1em]"
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
