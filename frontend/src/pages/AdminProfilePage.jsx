import { useEffect, useState } from "react";
import { Clock3, History, UserRound } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "../store/authStore";
import { apiErrorMessage, http } from "../lib/api";
import { Card, ErrorState, Loader, StatusBadge } from "../components/ui";

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
        setError(apiErrorMessage(requestError, "Unable to load your admin activity."));
      });
  }, [user?.id, retryCount]);

  if (!user) return <Loader />;

  return (
    <div className="admin-page mx-auto w-full max-w-[1200px] space-y-7">
      <header className="relative overflow-hidden rounded-[24px] bg-[#44318D] p-6 text-white shadow-[0_18px_42px_rgba(68,49,141,0.17)] sm:p-8">
        <span aria-hidden="true" className="absolute -right-8 -top-14 h-48 w-48 rounded-full border-[22px] border-white/[0.08]" />
        <div className="relative flex items-center gap-4 sm:gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 font-display text-2xl font-semibold text-[#F1A4C5]">
            {(user.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-nav text-[9px] uppercase tracking-[0.16em] text-white/70">Admin profile · Control centre</p>
            <h1 className="mt-1 break-all font-display text-2xl font-semibold sm:text-3xl">{user.name || user.email}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/75">
              <span>{user.role.replaceAll("_", " ")}</span>
              <span aria-hidden="true">·</span>
              <span>Admin ID {String(user.id).slice(-8).toUpperCase()}</span>
              <StatusBadge status={user.status} />
            </div>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/80 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-[#E98074]" /> Current session
          </span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="space-y-5">
          <Card className="border-[#E8E3E6] p-5 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#44318D]"><UserRound size={17} /></span>
              <div>
                <h2 className="font-display text-base font-semibold text-[#2A1B3D]">Account details</h2>
                <p className="text-xs text-[#8C8496]">Information currently associated with this admin login</p>
              </div>
            </div>
            <dl className="mt-5 grid gap-4 border-t border-[#EEE9EE] pt-5 sm:grid-cols-2">
              <div>
                <dt className="font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Work email</dt>
                <dd className="mt-1 break-all text-sm font-medium text-[#2A1B3D]">{user.email}</dd>
              </div>
              <div>
                <dt className="font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Account role</dt>
                <dd className="mt-1 text-sm font-medium text-[#2A1B3D]">{user.role.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt className="font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Account status</dt>
                <dd className="mt-1"><StatusBadge status={user.status} /></dd>
              </div>
              <div>
                <dt className="font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Last successful login</dt>
                <dd className="mt-1 text-sm font-medium text-[#2A1B3D]">
                  {user.lastLoginAt ? format(new Date(user.lastLoginAt), "d MMM yyyy, p") : "Not available"}
                </dd>
              </div>
            </dl>
          </Card>

        </div>

        <Card className="border-[#E8E3E6] p-5 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCEAF2] text-[#D83F87]"><History size={17} /></span>
            <div>
              <h2 className="font-display text-base font-semibold text-[#2A1B3D]">Your recent admin actions</h2>
              <p className="text-xs text-[#8C8496]">Personal activity from the audit trail</p>
            </div>
          </div>
          {!activity ? (
            error ? <ErrorState message={error} onRetry={() => { setError(""); setRetryCount((count) => count + 1); }} /> : <Loader />
          ) : activity.length === 0 ? (
            <p className="mt-5 rounded-xl bg-[#FCFAF8] p-4 text-sm text-[#8C8496]">No admin actions recorded for this account yet.</p>
          ) : (
            <ol className="mt-5 space-y-4 border-t border-[#EEE9EE] pt-5">
              {activity.slice(0, 10).map((item) => (
                <li key={item._id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#E98074]" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#2A1B3D]">{item.action.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-[#8C8496]">{item.targetType} · {String(item.targetId).slice(0, 12)}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[#A4B3B6]"><Clock3 size={12} />{format(new Date(item.createdAt), "d MMM yyyy, p")}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
