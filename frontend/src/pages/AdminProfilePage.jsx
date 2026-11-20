import { useEffect, useState } from "react";
import {
  Activity,
  Clock3,
  History,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage, http } from "../lib/api";
import { Card, ErrorState, Loader, StatusBadge } from "../components/ui";

function formatTimestamp(value) {
  if (!value) return "Not available";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : format(date, "d MMM yyyy, p");
}

function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A"
  );
}

function AccountField({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-[14px] border border-white/10 bg-white/[0.025] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#BDB1F0]">
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <dt className="font-nav text-[9px] uppercase tracking-[0.13em] text-[#A7A1B6]">
          {label}
        </dt>
        <dd className="mt-1 break-words text-sm font-medium text-[#F4F0F8]">
          {children}
        </dd>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    http
      .get(`/admin/audit-logs?actorId=${encodeURIComponent(user.id)}`)
      .then(setActivity)
      .catch((requestError) => {
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load your admin activity."
          )
        );
      });
  }, [user?.id, retryCount]);

  if (!user) return <Loader />;

  const displayName = user.name || user.email || "Administrator";
  const accountRole = user.role?.replaceAll("_", " ") || "Admin";
  const adminId = String(user.id || "").slice(-8).toUpperCase() || "Unavailable";

  return (
    <div className="admin-page mx-auto w-full max-w-[1440px] space-y-7">
      <header className="relative isolate overflow-hidden rounded-[24px] border border-white/10 bg-[#44318D] p-6 text-white shadow-[0_20px_48px_rgba(0,0,0,0.24)] sm:p-8 lg:p-9">
        <span
          aria-hidden="true"
          className="absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full border-[28px] border-white/[0.07]"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-28 right-1/4 -z-10 h-52 w-52 rounded-full bg-[#D83F87]/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 font-display text-2xl font-semibold text-[#F1A4C5] shadow-inner">
            {getInitials(displayName)}
          </div>

          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-white/75">
              <ShieldCheck size={13} />
              Administration · Access profile
            </p>
            <h1 className="mt-4 break-words font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {displayName}
            </h1>
            {user.email && (
              <p className="mt-1 flex items-center gap-2 break-all text-sm text-white/65">
                <Mail size={14} className="shrink-0" />
                {user.email}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs text-white/80">
                {accountRole}
              </span>
              <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 font-mono text-[10px] text-white/70">
                Admin ID · {adminId}
              </span>
              <StatusBadge status={user.status || "UNKNOWN"} />
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2.5 text-xs text-white/75 md:flex">
            <span className="h-2 w-2 rounded-full bg-[#69D2A0] shadow-[0_0_12px_rgba(105,210,160,0.75)]" />
            Current session
          </div>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <Card className="border-[#E8E3E6] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#BDB1F0]">
                <UserRound size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F4F0F8]">
                  Account details
                </h2>
                <p className="mt-0.5 text-xs text-[#A7A1B6]">
                  Information associated with this admin login
                </p>
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.12em] text-[#A7A1B6]">
              Read only
            </span>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <AccountField icon={Mail} label="Work email">
              {user.email || "Not available"}
            </AccountField>
            <AccountField icon={ShieldCheck} label="Account role">
              {accountRole}
            </AccountField>
            <AccountField icon={Activity} label="Account status">
              <StatusBadge status={user.status || "UNKNOWN"} />
            </AccountField>
            <AccountField icon={Clock3} label="Last successful login">
              {formatTimestamp(user.lastLoginAt)}
            </AccountField>
            <AccountField icon={UserRound} label="Admin ID">
              <span className="font-mono text-xs">{adminId}</span>
            </AccountField>
          </dl>

          <div className="mt-5 flex items-start gap-3 rounded-[14px] border border-[#D83F87]/20 bg-[#D83F87]/[0.06] p-4">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-[#F1A4C5]"
            />
            <p className="text-xs leading-5 text-[#C4BFD0]">
              Administrative actions are recorded in the audit trail for
              accountability.
            </p>
          </div>
        </Card>

        <Card className="border-[#E8E3E6] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCEAF2] text-[#F1A4C5]">
                <History size={18} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#F4F0F8]">
                  Recent admin activity
                </h2>
                <p className="mt-0.5 text-xs text-[#A7A1B6]">
                  Your actions from the audit trail
                </p>
              </div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-[#C4BFD0]">
              {activity?.length ?? "—"} events
            </span>
          </div>

          {!activity ? (
            error ? (
              <div className="mt-5">
                <ErrorState
                  message={error}
                  onRetry={() => {
                    setError("");
                    setRetryCount((count) => count + 1);
                  }}
                />
              </div>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader />
              </div>
            )
          ) : activity.length === 0 ? (
            <div className="mt-6 rounded-[14px] border border-white/10 bg-white/[0.025] px-5 py-10 text-center">
              <Activity size={24} className="mx-auto text-[#A7A1B6]" />
              <p className="mt-3 font-display text-base font-semibold text-[#F4F0F8]">
                No activity yet
              </p>
              <p className="mt-1 text-xs leading-5 text-[#A7A1B6]">
                Admin actions recorded for this account will appear here.
              </p>
            </div>
          ) : (
            <ol className="relative mt-6 space-y-0 border-l border-white/10 pl-5">
              {activity.slice(0, 10).map((item, index) => (
                <li
                  key={item._id}
                  className="relative pb-6 last:pb-0"
                >
                  <span
                    className={`absolute -left-[25px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#191b28] ${
                      index === 0 ? "bg-[#D83F87]" : "bg-[#77718A]"
                    }`}
                  />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="break-words text-sm font-semibold text-[#F4F0F8]">
                      {item.action?.replaceAll("_", " ") || "Admin action"}
                    </p>
                    <time
                      className="shrink-0 text-[11px] text-[#A7A1B6]"
                      dateTime={item.createdAt}
                    >
                      {formatTimestamp(item.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1 break-words text-xs text-[#C4BFD0]">
                    {item.targetType || "Record"}
                    {item.targetId
                      ? ` · ${String(item.targetId).slice(0, 12)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
