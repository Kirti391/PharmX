import { useEffect, useState } from "react";
import { Activity, History, Search } from "lucide-react";
import { format } from "date-fns";
import { apiErrorMessage, http } from "../lib/api";
import { Card, ErrorState, Input, Loader } from "../components/ui";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState(null);
  const [action, setAction] = useState("");
  const [targetId, setTargetId] = useState("");
  const [filters, setFilters] = useState({ action: "", targetId: "" });
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.targetId) params.set("targetId", filters.targetId);
    http
      .get(`/admin/audit-logs?${params}`)
      .then(setLogs)
      .catch((requestError) => {
        setError(apiErrorMessage(requestError, "Unable to load audit records."));
      });
  }, [filters, retryCount]);

  function applyFilters(event) {
    event.preventDefault();
    setLogs(null);
    setError("");
    setFilters({ action: action.trim(), targetId: targetId.trim() });
  }

  return (
    <div className="admin-page mx-auto w-full max-w-[1440px] space-y-7">
      <header className="relative overflow-hidden rounded-[24px] bg-[#44318D] p-6 text-white shadow-[0_18px_42px_rgba(68,49,141,0.17)] sm:p-8">
        <span aria-hidden="true" className="absolute -right-8 -top-14 h-48 w-48 rounded-full border-[22px] border-white/[0.08]" />
        <div className="relative flex items-end justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-white/85">
              <History size={13} /> Administration · Governance
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Audit trail</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Review recorded administrative and platform actions. Records are
              read-only here and shown newest first.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-3 sm:block">
            <p className="font-nav text-[9px] uppercase tracking-[0.14em] text-white/65">Loaded events</p>
            <p className="mt-1 font-display text-2xl font-semibold">{logs?.length ?? "—"}</p>
          </div>
        </div>
      </header>

      <Card className="border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-5">
        <form onSubmit={applyFilters} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="relative">
            <Activity size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A4B3B6]" />
            <Input aria-label="Filter by action" className="pl-9" value={action} onChange={(event) => setAction(event.target.value)} placeholder="Action contains (exact event)" />
          </div>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A4B3B6]" />
            <Input aria-label="Filter by target ID" className="pl-9" value={targetId} onChange={(event) => setTargetId(event.target.value)} placeholder="Target record ID" />
          </div>
          <button type="submit" className="rounded-xl bg-[#44318D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#35246F]">Apply filters</button>
        </form>
      </Card>

      {!logs ? (
        error ? <ErrorState message={error} onRetry={() => { setError(""); setRetryCount((count) => count + 1); }} /> : <Loader />
      ) : logs.length === 0 ? (
        <Card className="border-[#E8E3E6] p-8 text-center">
          <History className="mx-auto text-[#A4B3B6]" size={28} />
          <p className="mt-3 font-display text-lg font-semibold text-[#2A1B3D]">No audit activity found</p>
          <p className="mt-1 text-sm text-[#8C8496]">Try clearing a filter or check again after an action is recorded.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-[#E8E3E6] p-0 shadow-[0_8px_25px_rgba(42,27,61,0.035)]">
          <div className="divide-y divide-[#F0EDF1]">
            {logs.map((log) => (
              <article key={log._id} className="px-5 py-4 transition-colors hover:bg-[#FCFAFD] sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFEBF9] text-[#44318D]">
                    <Activity size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="break-all text-sm font-semibold text-[#2A1B3D]">{log.action.replaceAll("_", " ")}</h2>
                      <time className="text-xs text-[#8C8496]" dateTime={log.createdAt}>
                        {format(new Date(log.createdAt), "d MMM yyyy, p")}
                      </time>
                    </div>
                    <p className="mt-1 text-xs text-[#6E6658]">
                      {log.targetType} · target <span className="font-mono">{log.targetId}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#A4B3B6]">
                      Actor {log.userId ? String(log.userId) : "System"}{log.ipAddress ? ` · IP ${log.ipAddress}` : ""}
                    </p>
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="w-fit cursor-pointer text-xs font-medium text-[#44318D]">View recorded details</summary>
                        <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-[#FCFAF8] p-3 text-[11px] leading-5 text-[#514A58]">{JSON.stringify(log.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {logs.length === 500 && <p className="border-t border-[#EEE9EE] px-5 py-3 text-xs text-[#8C8496]">Showing the 500 most recent matching events.</p>}
        </Card>
      )}
    </div>
  );
}
