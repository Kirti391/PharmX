import { useEffect, useState } from "react";
import { ClipboardCheck, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { apiErrorMessage, http } from "../lib/api";
import { Button, Card, ErrorState, Loader, Select, StatusBadge } from "../components/ui";

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    http
      .get(`/admin/reports?${params}`)
      .then(setReports)
      .catch((requestError) => {
        setError(apiErrorMessage(requestError, "Unable to load user reports."));
      });
  }, [status, retryCount]);

  async function updateStatus(report, nextStatus) {
    const actionReason = window.prompt(
      `Add an internal reason for marking this report ${nextStatus.toLowerCase()}:`
    );
    if (!actionReason?.trim()) return;
    setError("");
    setBusyId(report.id);
    try {
      await http.patch(`/admin/reports/${report.id}/status`, {
        status: nextStatus,
        reason: actionReason.trim(),
      });
      setReports((current) =>
        current.map((item) =>
          item.id === report.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update this report."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="admin-page mx-auto w-full max-w-[1440px] space-y-7">
      <header className="relative overflow-hidden rounded-[24px] bg-[#44318D] p-6 text-white shadow-[0_18px_42px_rgba(68,49,141,0.17)] sm:p-8">
        <span aria-hidden="true" className="absolute -right-8 -top-14 h-48 w-48 rounded-full border-[22px] border-white/[0.08]" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-white/85">
              <ShieldAlert size={13} />
              Administration · Safety
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Reports & complaints</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Review user-submitted reports, record a reason for each decision,
              and preserve an audit trail. Reporter contact details are not
              shown in this queue.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
            <p className="font-nav text-[9px] uppercase tracking-[0.14em] text-white/65">Open reports</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {reports ? reports.filter((report) => report.status === "OPEN").length : "—"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex justify-end">
        <Select aria-label="Filter reports by status" className="sm:max-w-[210px]" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="DISMISSED">Dismissed</option>
        </Select>
      </div>

      {error && reports && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!reports ? (
        error ? <ErrorState message={error} onRetry={() => { setError(""); setRetryCount((count) => count + 1); }} /> : <Loader />
      ) : reports.length === 0 ? (
        <Card className="border-[#E8E3E6] p-8 text-center">
          <ClipboardCheck className="mx-auto text-[#A4B3B6]" size={28} />
          <p className="mt-3 font-display text-lg font-semibold text-[#2A1B3D]">No reports match this view</p>
          <p className="mt-1 text-sm text-[#8C8496]">New reports will appear here for operational review.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-[#2A1B3D]">{report.reason.replaceAll("_", " ")}</h2>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="mt-1 text-xs text-[#8C8496]">
                    Report {String(report.id).slice(-8)} · submitted {format(new Date(report.createdAt), "d MMM yyyy, p")}
                  </p>
                  <p className="mt-3 text-xs text-[#6E6658]">
                    Reported account ID: <span className="font-mono">{String(report.targetUserId).slice(0, 8)}…</span>
                  </p>
                  {report.details && (
                    <p className="mt-3 max-w-3xl whitespace-pre-wrap rounded-xl bg-[#FCFAF8] p-3 text-sm leading-6 text-[#514A58]">
                      {report.details}
                    </p>
                  )}
                </div>
                {report.status === "OPEN" && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button size="sm" disabled={Boolean(busyId)} onClick={() => updateStatus(report, "REVIEWED")}>
                      {busyId === report.id ? "Saving…" : "Mark reviewed"}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={Boolean(busyId)} onClick={() => updateStatus(report, "DISMISSED")}>
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
