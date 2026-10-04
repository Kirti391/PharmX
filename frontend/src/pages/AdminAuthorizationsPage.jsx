import { useEffect, useState } from "react";
import { BadgeCheck, Building2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { apiErrorMessage, http } from "../lib/api";
import { Button, Card, EmptyState, ErrorState, Loader, Select, StatusBadge } from "../components/ui";

export default function AdminAuthorizationsPage() {
  const [authorizations, setAuthorizations] = useState(null);
  const [status, setStatus] = useState("PENDING");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    http
      .get(`/admin/authorizations?status=${status}`)
      .then(setAuthorizations)
      .catch((requestError) => {
        setError(apiErrorMessage(requestError, "Unable to load company authorizations."));
      });
  }, [status, retryCount]);

  async function review(item, decision) {
    const reason = decision === "reject"
      ? window.prompt("Enter the reason for rejecting this authorization:")
      : null;
    if (decision === "reject" && !reason?.trim()) return;
    setBusyId(item.id);
    setError("");
    try {
      await http.patch(
        `/admin/authorizations/${item.id}/${decision}`,
        decision === "reject" ? { reason: reason.trim() } : undefined
      );
      setAuthorizations((current) => current.filter((row) => row.id !== item.id));
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to review this authorization."));
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
              <ShieldCheck size={13} />
              Administration · Identity & authorization
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Company–MR authorizations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Review representation scope separately from MR identity verification.
              Approval requires an already approved linked authorization document.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
            <p className="font-nav text-[9px] uppercase tracking-[0.14em] text-white/65">In this queue</p>
            <p className="mt-1 font-display text-2xl font-semibold">{authorizations?.length ?? "—"}</p>
          </div>
        </div>
      </header>

      <Card className="flex flex-col gap-4 border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCEAF2] text-[#D83F87]"><Building2 size={18} /></span>
          <div>
            <p className="text-sm font-semibold text-[#2A1B3D]">Authorization records</p>
            <p className="text-xs text-[#8C8496]">Identity verification does not grant company representation rights.</p>
          </div>
        </div>
        <Select aria-label="Filter authorizations by status" className="sm:max-w-[210px]" value={status} onChange={(event) => { setAuthorizations(null); setError(""); setStatus(event.target.value); }}>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
          <option value="REVOKED">Revoked</option>
          <option value="EXPIRED">Expired</option>
        </Select>
      </Card>

      {error && authorizations && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!authorizations ? (
        error ? <ErrorState message={error} onRetry={() => { setError(""); setRetryCount((count) => count + 1); }} /> : <Loader />
      ) : authorizations.length === 0 ? (
        <Card className="border-[#E8E3E6]"><EmptyState title={`No ${status.toLowerCase()} authorizations`} subtitle="Company representation is reviewed independently from identity verification." /></Card>
      ) : (
        <div className="space-y-3">
          {authorizations.map((item) => (
            <Card key={item.id} className="border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:p-5">
              <div className="flex flex-col justify-between gap-5 lg:flex-row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-semibold text-[#2A1B3D]">{item.companyName}</h2>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#6E6658]">MR: {item.mrName}</p>
                  <p className="mt-1 text-xs text-[#8C8496]">
                    Submitted {format(new Date(item.createdAt), "d MMM yyyy")} · expires {format(new Date(item.expiresAt), "d MMM yyyy")}
                  </p>
                  <p className="mt-3 text-xs font-nav uppercase tracking-[0.1em] text-[#8C8496]">Categories</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.categories.map((category) => <span key={category} className="rounded-full bg-[#EFEBF9] px-2.5 py-1 text-xs text-[#44318D]">{category}</span>)}
                  </div>
                  <p className="mt-3 text-xs font-nav uppercase tracking-[0.1em] text-[#8C8496]">Territories</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.territories.map((territory) => <span key={territory} className="rounded-full bg-[#EEF2F2] px-2.5 py-1 text-xs text-[#596C70]">{territory}</span>)}
                  </div>
                  <p className="mt-3 break-all text-[11px] text-[#A4B3B6]">Linked authorization document ID: {item.verificationDocumentId}</p>
                </div>
                {item.status === "PENDING" && (
                  <div className="flex shrink-0 flex-wrap items-start gap-2">
                    <Button size="sm" disabled={Boolean(busyId)} onClick={() => review(item, "approve")}>
                      <BadgeCheck size={14} /> {busyId === item.id ? "Reviewing…" : "Approve"}
                    </Button>
                    <Button size="sm" variant="danger" disabled={Boolean(busyId)} onClick={() => review(item, "reject")}>Reject</Button>
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
