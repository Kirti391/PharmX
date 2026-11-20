import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  RefreshCw,
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
  return rows.reduce((sum, row) => sum + (Number(row.count) || 0), 0);
}

function MetricCard({ label, value, detail, icon: Icon, accent, to }) {
  const content = (
    <div className="admin-metric-card group relative flex h-full min-h-[130px] items-start justify-between gap-3 rounded-[20px] border border-[#ECE8F1] bg-white p-4 shadow-[0_8px_24px_rgba(42,27,61,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.2)] sm:p-5">
      <div className="min-w-0">
        <p className="font-nav text-[9px] uppercase tracking-[0.14em] text-[#A7A1B6]">
          {label}
        </p>
        <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-[#F4F0F8]">
          {Number(value || 0).toLocaleString()}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-[#A7A1B6]">{detail}</p>
      </div>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ color: accent.color, backgroundColor: `${accent.color}22` }}
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>
      {to && (
        <ArrowRight
          size={14}
          aria-hidden="true"
          className="absolute bottom-4 right-4 text-[#77718A] transition group-hover:translate-x-0.5 group-hover:text-[#F1A4C5]"
        />
      )}
    </div>
  );

  return to ? (
    <Link
      to={to}
      className="block h-full rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D83F87]"
    >
      {content}
    </Link>
  ) : (
    content
  );
}

function MetricGroup({ eyebrow, title, description, columns, children }) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-[#BDB1F0]">
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-[#F4F0F8]">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-xs leading-5 text-[#A7A1B6]">
          {description}
        </p>
      </div>
      <div className={`grid gap-3 sm:grid-cols-2 ${columns}`}>{children}</div>
    </section>
  );
}

function Breakdown({ title, rows = [], labelKey, accent }) {
  const maximum = Math.max(1, ...rows.map((row) => Number(row.count) || 0));

  return (
    <Card className="border-[#E8E3E6] p-5 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-base font-semibold text-[#2A1B3D]">
          {title}
        </h3>
        <span
          className="rounded-full px-2.5 py-1 font-nav text-[9px] uppercase tracking-[0.1em]"
          style={{ color: accent.color, backgroundColor: accent.tint }}
        >
          {total(rows).toLocaleString()} total
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
                  {Number(row.count || 0).toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EDF1]">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${((Number(row.count) || 0) / maximum) * 100}%`,
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
      className="admin-action group flex min-h-[78px] items-center gap-3 rounded-[14px] border border-[#EEE9EE] bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D8D0E7] hover:bg-[#FCFAFD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D83F87]"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105"
        style={{ color: accent.color, backgroundColor: accent.tint }}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#2A1B3D]">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-[#8C8496]">
          {description}
        </span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-[#A7A1B6] transition-all group-hover:translate-x-0.5 group-hover:border-[#D83F87]/30 group-hover:text-[#F1A4C5]">
        <ArrowRight size={14} />
      </span>
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

  function refreshOverview() {
    setOverview(null);
    setError("");
    setRetryCount((count) => count + 1);
  }

  return (
    <div className="admin-page admin-dashboard mx-auto w-full max-w-[1440px] space-y-8 sm:space-y-9">
      <header className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#44318D] p-6 text-white shadow-[0_20px_48px_rgba(0,0,0,0.24)] sm:p-8 lg:p-9">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[28px] border-white/[0.07]"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-28 right-1/4 h-52 w-52 rounded-full bg-[#D83F87]/10 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-white/80">
              <Activity size={13} />
              Administration · Platform health
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Platform overview
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Monitor account health, trust reviews, marketplace activity, and
              operational risk in one place.
            </p>
          </div>

          <div className="relative flex flex-wrap gap-2">
            <Button
              variant="ghost"
              className="border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
              onClick={refreshOverview}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Link
              to="/admin/users"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              Manage users
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/admin/verifications"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D83F87] bg-[#D83F87] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-[#C93679] hover:bg-[#C93679]"
            >
              <BadgeCheck size={15} />
              Review documents
            </Link>
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-white/60">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#69D2A0]" />
            Metrics updated on request
          </span>
          <span>Use the review queues below to take action.</span>
        </div>
      </header>

      <div className="admin-metrics-section space-y-7">
        <MetricGroup
          eyebrow="01 · People"
          title="Account health"
          description="A quick read on registration and access across the network."
          columns="xl:grid-cols-4"
        >
          <MetricCard
            label="Registered accounts"
            value={overview.totalUsers ?? total(overview.usersByRole)}
            detail={`${overview.usersByRole?.length || 0} account types`}
            icon={UsersRound}
            accent={ACCENTS.purple}
            to="/admin/users"
          />
          <MetricCard
            label="Active users"
            value={overview.activeUsers}
            detail="Accounts currently active"
            icon={UsersRound}
            accent={ACCENTS.slate}
            to="/admin/users"
          />
          <MetricCard
            label="Pending users"
            value={overview.pendingUsers}
            detail="Awaiting verification"
            icon={ShieldCheck}
            accent={ACCENTS.coral}
            to="/admin/users"
          />
          <MetricCard
            label="Suspended users"
            value={overview.suspendedUsers}
            detail="Access currently suspended"
            icon={ShieldAlert}
            accent={ACCENTS.pink}
            to="/admin/users"
          />
        </MetricGroup>

        <MetricGroup
          eyebrow="02 · Trust & safety"
          title="Review queues"
          description="Prioritize documents, representation requests, and reported activity."
          columns="xl:grid-cols-3"
        >
          <MetricCard
            label="Documents to review"
            value={overview.pendingVerifications}
            detail="Verification queue"
            icon={BadgeCheck}
            accent={ACCENTS.coral}
            to="/admin/verifications"
          />
          <MetricCard
            label="Company authorizations"
            value={overview.pendingAuthorizations}
            detail="Representation reviews"
            icon={BriefcaseBusiness}
            accent={ACCENTS.purple}
            to="/admin/authorizations"
          />
          <MetricCard
            label="Open reports"
            value={overview.openReports}
            detail="Safety reports to review"
            icon={ShieldAlert}
            accent={ACCENTS.pink}
            to="/admin/reports"
          />
          <MetricCard
            label="Expiring in 30 days"
            value={overview.documentsExpiring30Days}
            detail="Approved documents nearing expiry"
            icon={CalendarDays}
            accent={ACCENTS.slate}
            to="/admin/verifications"
          />
          <MetricCard
            label="Expired documents"
            value={overview.expiredDocuments}
            detail="Approved records past expiry"
            icon={ShieldCheck}
            accent={ACCENTS.coral}
            to="/admin/verifications"
          />
          <MetricCard
            label="Unread admin alerts"
            value={overview.unreadAdminNotifications}
            detail="In-app notifications"
            icon={Bell}
            accent={ACCENTS.purple}
            to="/notifications"
          />
        </MetricGroup>

        <MetricGroup
          eyebrow="03 · Marketplace"
          title="Network activity"
          description="Current activity across procurement and business opportunities."
          columns="xl:grid-cols-2"
        >
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
        </MetricGroup>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <section className="space-y-5">
          <div>
            <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-[#BDB1F0]">
              Network pulse
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[#F4F0F8]">
              Platform breakdowns
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

        <aside className="space-y-5">
          <div className="px-6 pt-3">
            <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-[#BDB1F0]">
              Admin workspace
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[#F4F0F8]">
              Quick access & activity
            </h2>
          </div>

          <Card className="border-[#E8E3E6] p-6 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-7">
            <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#BDB1F0]">
                <ArrowRight size={16} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[#F4F0F8]">
                  Admin shortcuts
                </h3>
                <p className="mt-0.5 text-[11px] text-[#A7A1B6]">
                  Go directly to a review workspace
                </p>
              </div>
            </div>
            <div className="grid gap-2.5">
              <AdminAction
                to="/admin/users"
                icon={UsersRound}
                title="Account directory"
                description="Search users and manage access"
                accent={ACCENTS.purple}
              />
              <AdminAction
                to="/admin/verifications"
                icon={BadgeCheck}
                title="Trust review queue"
                description={`${overview.pendingVerifications || 0} document${overview.pendingVerifications === 1 ? "" : "s"} waiting for review`}
                accent={ACCENTS.coral}
              />
              <AdminAction
                to="/admin/authorizations"
                icon={BriefcaseBusiness}
                title="Company authorizations"
                description={`${overview.pendingAuthorizations || 0} request${overview.pendingAuthorizations === 1 ? "" : "s"} awaiting review`}
                accent={ACCENTS.purple}
              />
              <AdminAction
                to="/admin/reports"
                icon={ShieldAlert}
                title="Safety reports"
                description={`${overview.openReports || 0} open report${overview.openReports === 1 ? "" : "s"}`}
                accent={ACCENTS.pink}
              />
            </div>
          </Card>

          <Card className="admin-activity-card overflow-hidden border-[#E8E3E6] p-0 shadow-[0_8px_25px_rgba(42,27,61,0.035)]">
            <div className="flex items-center justify-between gap-3 border-b border-[#EEE9EE] px-6 py-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCEAF2] text-[#F1A4C5]">
                  <Activity size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F0F8]">
                    Operational activity
                  </h3>
                  <p className="mt-0.5 text-[11px] text-[#A7A1B6]">
                    Across the network
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-nav text-[8px] uppercase tracking-[0.12em] text-[#A7A1B6]">
                Totals
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-1">
              <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.025] p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBEAE6] text-[#E98074]">
                  <CalendarDays size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.13em] text-[#A7A1B6]">
                    Appointments tracked
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-[#F4F0F8]">
                    {appointmentCount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/[0.025] p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#BDB1F0]">
                  <MessageSquare size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.13em] text-[#A7A1B6]">
                    Messages sent
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-[#F4F0F8]">
                    {Number(overview.totalMessages || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 px-6 py-4">
              <Link
                to="/admin/audit"
                className="group inline-flex items-center gap-2 text-xs font-medium text-[#D7CFF3] transition hover:text-white"
              >
                View audit trail
                <ArrowRight
                  size={13}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
