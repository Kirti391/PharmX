import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { apiErrorMessage, http } from "../lib/api";
import { Button, Card, ErrorState, Loader } from "../components/ui";

const ACCENTS = {
  purple: { color: "#44318D", tint: "#EFEBF9" },
  coral: { color: "#E98074", tint: "#FBEAE6" },
  pink: { color: "#D83F87", tint: "#FCEAF2" },
  slate: { color: "#75878B", tint: "#EEF2F2" },
};

function total(rows = []) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function MetricCard({ label, value, detail, icon: Icon, accent }) {
  return (
    <div className="group relative flex min-h-[124px] items-start justify-between gap-3 rounded-[18px] border border-[#ECE8F1] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(42,27,61,0.025)] transition-shadow hover:shadow-[0_10px_24px_rgba(42,27,61,0.06)] sm:px-5 sm:py-5">
      <div>
        <p className="font-nav text-[10px] uppercase tracking-[0.14em] text-[#8C8496]">
          {label}
        </p>
        <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-[#2A1B3D]">
          {value.toLocaleString()}
        </p>
        <p className="mt-1.5 text-xs text-[#8C8496]">{detail}</p>
      </div>
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ color: accent.color, backgroundColor: `${accent.color}22` }}
      >
        <Icon size={17} strokeWidth={1.8} />
      </span>
    </div>
  );
}

function Breakdown({ title, rows = [], labelKey, accent }) {
  const maximum = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Card className="border-[#E8E3E6] p-5 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-base font-semibold text-[#2A1B3D]">
          {title}
        </h2>
        <span
          className="rounded-full px-2.5 py-1 font-nav text-[9px] uppercase tracking-[0.1em]"
          style={{ color: accent.color, backgroundColor: accent.tint }}
        >
          {total(rows)} total
        </span>
      </div>
      {rows.length ? (
        <ul className="mt-5 space-y-4">
          {rows.map((row) => (
            <li key={row[labelKey]}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-[#6E6658]">
                  {String(row[labelKey] || "Unspecified").replaceAll("_", " ")}
                </span>
                <span className="font-semibold tabular-nums text-[#2A1B3D]">
                  {row.count}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EDF1]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${(row.count / maximum) * 100}%`,
                    backgroundColor: accent.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-[#FCFAF8] px-4 py-5 text-sm text-[#8C8496]">
          No data recorded yet.
        </p>
      )}
    </Card>
  );
}

function AdminAction({ to, icon: Icon, title, description, accent }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-[#EEE9EE] bg-white p-3.5 transition hover:border-[#D8D0E7] hover:bg-[#FCFAFD]"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ color: accent.color, backgroundColor: accent.tint }}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#2A1B3D]">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-[#8C8496]">
          {description}
        </span>
      </span>
      <ArrowRight
        size={15}
        className="shrink-0 text-[#A4B3B6] transition group-hover:translate-x-0.5 group-hover:text-[#44318D]"
      />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    http
      .get("/admin/analytics/overview")
      .then(setOverview)
      .catch((requestError) => {
        setError(
          apiErrorMessage(requestError, "Unable to load the platform overview.")
        );
      });
  }, [retryCount]);

  if (!overview) {
    return error ? (
      <ErrorState
        message={error}
        onRetry={() => {
          setError("");
          setRetryCount((count) => count + 1);
        }}
      />
    ) : (
      <Loader />
    );
  }

  const openRequirements =
    overview.requirementsByStatus?.find((row) => row.status === "OPEN")?.count ||
    0;
  const openOpportunities =
    overview.opportunitiesByStatus?.find((row) => row.status === "OPEN")
      ?.count || 0;
  const appointmentCount = total(overview.appointmentsByStatus);

  return (
    <div className="admin-page admin-dashboard mx-auto w-full max-w-[1440px] space-y-8 sm:space-y-9">
      <header className="relative overflow-hidden rounded-[18px] border border-t-[3px] border-[#ECE8F1] border-t-[#44318D] bg-white p-6 text-[#2A1B3D] shadow-[0_6px_22px_rgba(42,27,61,0.04)] sm:p-8 lg:p-9">
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#ECE8F1] bg-white px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-[#44318D]">
              <Activity size={13} />
              Administration · Platform health
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">
              Good overview.
              <span className="text-[#44318D]"> Clear next steps.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#5B5265]">
              Monitor the professional network, review trust workflows, and
              keep platform activity moving.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="border-[#ECE8F1] bg-white text-[#2A1B3D] hover:bg-[#F7F5FA]"
              onClick={() => {
                setOverview(null);
                setError("");
                setRetryCount((count) => count + 1);
              }}
            >
              Refresh overview
            </Button>
            <Link
              to="/admin/users"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ECE8F1] bg-white px-4 py-2.5 text-sm font-semibold text-[#2A1B3D] transition hover:bg-[#F7F5FA]"
            >
              Manage users
            </Link>
            <Link
              to="/admin/verifications"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#44318D] bg-[#44318D] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#382775] hover:bg-[#382775]"
            >
              Review documents
            </Link>
          </div>
        </div>
        <div className="relative mt-7 flex items-center gap-2 border-t border-[#ECE8F1] pt-4 text-xs text-[#8C8496]">
          <span className="h-2 w-2 rounded-full bg-[#E98074]" />
          Operational totals · refreshes on request
        </div>
      </header>

      <section aria-label="Platform metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        <MetricCard
          label="Registered accounts"
          value={overview.totalUsers ?? total(overview.usersByRole)}
          detail={`${overview.usersByRole?.length || 0} account types`}
          icon={UsersRound}
          accent={ACCENTS.purple}
        />
        <MetricCard
          label="Active users"
          value={overview.activeUsers || 0}
          detail="Accounts currently active"
          icon={UsersRound}
          accent={ACCENTS.slate}
        />
        <MetricCard
          label="Pending users"
          value={overview.pendingUsers || 0}
          detail="Accounts pending verification"
          icon={ShieldCheck}
          accent={ACCENTS.coral}
        />
        <MetricCard
          label="Suspended users"
          value={overview.suspendedUsers || 0}
          detail="Accounts with access suspended"
          icon={ShieldCheck}
          accent={ACCENTS.pink}
        />
        <MetricCard
          label="Documents to review"
          value={overview.pendingVerifications || 0}
          detail="Verification queue"
          icon={BadgeCheck}
          accent={ACCENTS.coral}
        />
        <MetricCard
          label="Company authorizations"
          value={overview.pendingAuthorizations || 0}
          detail="Pending representation reviews"
          icon={BriefcaseBusiness}
          accent={ACCENTS.purple}
        />
        <MetricCard
          label="Open reports"
          value={overview.openReports || 0}
          detail="Safety reports to review"
          icon={ShieldAlert}
          accent={ACCENTS.pink}
        />
        <MetricCard
          label="Expiring in 30 days"
          value={overview.documentsExpiring30Days || 0}
          detail="Approved documents nearing expiry"
          icon={CalendarDays}
          accent={ACCENTS.slate}
        />
        <MetricCard
          label="Expired documents"
          value={overview.expiredDocuments || 0}
          detail="Approved records past expiry"
          icon={ShieldCheck}
          accent={ACCENTS.coral}
        />
        <MetricCard
          label="Unread admin alerts"
          value={overview.unreadAdminNotifications || 0}
          detail="In-app notifications"
          icon={MessageSquare}
          accent={ACCENTS.purple}
        />
        <MetricCard
          label="Open requirements"
          value={openRequirements}
          detail="Active marketplace demand"
          icon={ClipboardList}
          accent={ACCENTS.pink}
        />
        <MetricCard
          label="Open opportunities"
          value={openOpportunities}
          detail="Roles and business opportunities"
          icon={BriefcaseBusiness}
          accent={ACCENTS.slate}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
        <section className="space-y-4">
          <div>
            <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-[#E98074]">
              Network pulse
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[#2A1B3D]">
              What’s happening
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Breakdown
              title="Accounts by role"
              rows={overview.usersByRole}
              labelKey="role"
              accent={ACCENTS.purple}
            />
            <Breakdown
              title="Account status"
              rows={overview.usersByStatus}
              labelKey="status"
              accent={ACCENTS.coral}
            />
            <Breakdown
              title="Requirements"
              rows={overview.requirementsByStatus}
              labelKey="status"
              accent={ACCENTS.pink}
            />
            <Breakdown
              title="Opportunities"
              rows={overview.opportunitiesByStatus}
              labelKey="status"
              accent={ACCENTS.slate}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <div>
            <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-[#44318D]">
              Admin workspace
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[#2A1B3D]">
              Shortcuts & activity
            </h2>
          </div>
          <Card className="border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-5">
            <div className="space-y-2.5">
              <AdminAction
                to="/admin/users"
                icon={UsersRound}
                title="Account directory"
                description="Filter users and manage access"
                accent={ACCENTS.purple}
              />
              <AdminAction
                to="/admin/verifications"
                icon={BadgeCheck}
                title="Trust review queue"
                description={`${overview.pendingVerifications || 0} document${overview.pendingVerifications === 1 ? "" : "s"} waiting for review`}
                accent={ACCENTS.coral}
              />
            </div>
          </Card>

          <Card className="overflow-hidden border-[#E8E3E6] p-0 shadow-[0_8px_25px_rgba(42,27,61,0.035)]">
            <div className="flex items-center gap-3 border-b border-[#EEE9EE] px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCEAF2] text-[#D83F87]">
                <Activity size={17} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#2A1B3D]">
                  Platform activity
                </h3>
                <p className="text-[11px] text-[#8C8496]">Across the network</p>
              </div>
            </div>
            <div className="divide-y divide-[#F0EDF1] px-5">
              <div className="flex items-center justify-between gap-3 py-4">
                <span className="flex items-center gap-2 text-xs text-[#6E6658]">
                  <CalendarDays size={14} className="text-[#E98074]" />
                  Appointments
                </span>
                <span className="font-display text-lg font-semibold tabular-nums text-[#2A1B3D]">
                  {appointmentCount}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-4">
                <span className="flex items-center gap-2 text-xs text-[#6E6658]">
                  <MessageSquare size={14} className="text-[#44318D]" />
                  Messages sent
                </span>
                <span className="font-display text-lg font-semibold tabular-nums text-[#2A1B3D]">
                  {overview.totalMessages.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
