import { useEffect, useState } from "react";
import { apiErrorMessage, http, API_URL } from "../lib/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Loader,
  Select,
  StatusBadge,
} from "../components/ui";
import { format } from "date-fns";
import { BadgeCheck, FileCheck2 } from "lucide-react";

export default function AdminVerificationsPage() {
  const [docs, setDocs] = useState(null);
  const [status, setStatus] = useState("PENDING");
  const [role, setRole] = useState("");
  const [docType, setDocType] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  function load() {
    setDocs(null);
    setError("");
    setRetryCount((count) => count + 1);
  }

  useEffect(() => {
    const params = new URLSearchParams({ status });
    if (role) params.set("role", role);
    if (docType) params.set("docType", docType);
    http
      .get(`/admin/verifications?${params}`)
      .then(setDocs)
      .catch((requestError) => {
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load pending verification documents."
          )
        );
      });
  }, [status, role, docType, retryCount]);

  async function review(document, decision) {
    const reason =
      decision === "reject"
        ? window.prompt("Enter the document rejection reason:")
        : null;
    if (decision === "reject" && !reason?.trim()) return;

    setError("");
    setBusyId(document.id);
    try {
      await http.patch(
        `/admin/verifications/${document.id}/${decision}`,
        decision === "reject" ? { reason } : undefined
      );
      setDocs((current) =>
        current.filter((item) => item.id !== document.id)
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.error?.message ||
          "Unable to update this document."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="admin-page mx-auto w-full max-w-[1440px] space-y-7">
      <header className="relative overflow-hidden rounded-[24px] bg-[#44318D] p-6 text-white shadow-[0_18px_42px_rgba(68,49,141,0.17)] sm:p-8">
        <span
          aria-hidden="true"
          className="absolute -right-8 -top-14 h-48 w-48 rounded-full border-[22px] border-white/[0.08]"
        />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.16em] text-white/85">
              <BadgeCheck size={13} />
              Administration · Trust review
            </p>
            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              Verification desk
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              Review every submitted document independently. Approving one
              record does not automatically verify unrelated business or
              identity records.
            </p>
          </div>
        </div>
      </header>
      <Card className="grid gap-3 border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] sm:grid-cols-3 sm:p-5">
        <div>
          <label htmlFor="verification-status" className="mb-1.5 block font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Document status</label>
          <Select id="verification-status" value={status} onChange={(event) => { setDocs(null); setError(""); setStatus(event.target.value); }}>
            <option value="PENDING">Pending review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
        <div>
          <label htmlFor="verification-role" className="mb-1.5 block font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Account role</label>
          <Select id="verification-role" value={role} onChange={(event) => { setDocs(null); setError(""); setRole(event.target.value); }}>
            <option value="">All roles</option>
            <option value="PHARMA_COMPANY">Pharma company</option>
            <option value="MR">Medical representative</option>
            <option value="PHARMACY">Pharmacy</option>
            <option value="DISTRIBUTOR_STOCKIST">Distributor / stockist</option>
            <option value="DOCTOR">Doctor</option>
          </Select>
        </div>
        <div>
          <label htmlFor="verification-type" className="mb-1.5 block font-nav text-[9px] uppercase tracking-[0.12em] text-[#8C8496]">Document type</label>
          <Select id="verification-type" value={docType} onChange={(event) => { setDocs(null); setError(""); setDocType(event.target.value); }}>
            <option value="">All document types</option>
            <option value="DRUG_LICENSE">Drug licence</option>
            <option value="GST">GST</option>
            <option value="ID_PROOF">Identity proof</option>
            <option value="MEDICAL_REGISTRATION">Medical registration</option>
            <option value="COMPANY_AUTHORIZATION">Company authorization</option>
            <option value="BUSINESS_REG">Business registration</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </Card>
      {error && docs && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!docs && error ? (
        <ErrorState
          message={error}
          onRetry={() => {
            setError("");
            load();
          }}
        />
      ) : !docs ? (
        <Loader />
      ) : docs.length === 0 ? (
        <Card className="border-[#E8E3E6]">
          <EmptyState
            title={`No ${status.toLowerCase()} documents`}
            subtitle={status === "PENDING" ? "You're all caught up." : "Documents with this status will appear here."}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <Card key={d.id} className="border-[#E8E3E6] p-4 shadow-[0_8px_25px_rgba(42,27,61,0.035)] transition hover:shadow-[0_14px_32px_rgba(42,27,61,0.07)] sm:p-5">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCEAF2] text-[#D83F87]">
                    <FileCheck2 size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#2A1B3D]">{d.docType.replaceAll("_", " ")}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#8C8496]">
                      {d.userEmail || `User ${d.userId.toString().slice(0, 8)}…`}
                      {d.role && ` · ${d.role.replaceAll("_", " ")}`}
                      {" · submitted "}{format(new Date(d.createdAt), "d MMM yyyy")}
                    </p>
                    {d.expiryDate && (
                      <p className="mt-1 text-xs text-[#8C8496]">
                        Expires {format(new Date(d.expiryDate), "d MMM yyyy")}
                      </p>
                    )}
                    {d.companyId && (
                      <p className="mt-1 text-xs text-[#8C8496]">
                        Linked company {d.companyId.toString().slice(0, 8)}…
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[#A4B3B6]">
                      Review records one document at a time
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                  <a
                    href={d.fileUrl.startsWith("http") ? d.fileUrl : `${API_URL}${d.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mr-1 rounded-xl border border-[#E9E2EA] px-3 py-2 text-sm font-semibold text-[#44318D] transition-colors hover:border-[#44318D]/30 hover:bg-[#F7F5FA]"
                  >
                    View file
                  </a>
                  {d.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        disabled={Boolean(busyId)}
                        onClick={() => review(d, "approve")}
                      >
                        {busyId === d.id ? "Reviewing…" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={Boolean(busyId)}
                        onClick={() => review(d, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
