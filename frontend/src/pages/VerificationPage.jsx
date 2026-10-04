import { useEffect, useState } from "react";
import { http, api, apiErrorMessage } from "../lib/api";
import { Card, EmptyState, ErrorState, Label, Loader, Select, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { format } from "date-fns";
import { useAuthStore } from "../store/authStore";

const BUSINESS_DOC_TYPES = [
  "DRUG_LICENSE",
  "GST",
  "ID_PROOF",
  "BUSINESS_REG",
  "OTHER",
];
const EXPIRY_REQUIRED_TYPES = new Set([
  "DRUG_LICENSE",
  "MEDICAL_REGISTRATION",
  "COMPANY_AUTHORIZATION",
]);

export default function VerificationPage() {
  const user = useAuthStore((state) => state.user);
  const isDoctor = user?.role === "DOCTOR";
  const isMR = user?.role === "MR";
  const docTypes = isDoctor
    ? ["MEDICAL_REGISTRATION", "ID_PROOF"]
    : isMR
      ? ["ID_PROOF", "COMPANY_AUTHORIZATION", "OTHER"]
      : BUSINESS_DOC_TYPES;
  const [docs, setDocs] = useState(null);
  const [docType, setDocType] = useState(docTypes[0]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [documentsError, setDocumentsError] = useState("");
  const [documentsRetryCount, setDocumentsRetryCount] = useState(0);
  const [uploading, setUploading] = useState(false);

  function load() {
    http
      .get("/verification/status")
      .then(setDocs)
      .catch((requestError) => {
        setDocumentsError(
          apiErrorMessage(requestError, "Unable to load submitted documents.")
        );
      });
  }
  useEffect(load, [documentsRetryCount]);

  useEffect(() => {
    if (!isMR) return;
    http
      .get("/discover/companies")
      .then((rows) =>
        setCompanies(
          (Array.isArray(rows) ? rows : []).filter(
            (company) =>
              company.businessVerified &&
              company.verificationStatus === "VERIFIED"
          )
        )
      )
      .catch((requestError) =>
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load verified companies."
          )
        )
      );
  }, [isMR]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("docType", docType);
      if (docType === "COMPANY_AUTHORIZATION") {
        formData.append("companyId", companyId);
      }
      if (EXPIRY_REQUIRED_TYPES.has(docType)) {
        formData.append("expiryDate", expiryDate);
      }
      formData.append("file", file);
      await api.post("/verification/documents", formData);
      setFile(null);
      setExpiryDate("");
      setDocumentsError("");
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:p-7">
        <p className="font-nav text-[9px] uppercase tracking-[0.18em] text-primary">Trust & safety</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy sm:text-3xl">
          {isDoctor ? "Professional Registration Verification" : "Business Verification"}
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-[#6E6658]">
          {isDoctor
            ? "Submit your medical registration for review. Doctors are only discoverable for professional requests after registration is verified and they opt in."
            : "Upload your business documents so an admin can verify your account. This unlocks the verified badge visible to other members."}
        </p>
      </header>

      <Card className="border-[#E9E2EA] p-5 sm:p-7">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>Document type</Label>
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {docTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          {docType === "COMPANY_AUTHORIZATION" && (
            <div>
              <Label>Company represented</Label>
              <Select
                required
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
              >
                <option value="">Select a verified company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs leading-5 text-[#6E6658]">
                The authorization letter is reviewed by PharmX and matched to
                this company before your request can be approved.
              </p>
            </div>
          )}
          {EXPIRY_REQUIRED_TYPES.has(docType) && (
            <div>
              <Label>Document expiry date</Label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                className="w-full rounded-xl border border-[#E5DEE7] bg-[#FCFAF8] px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <p className="mt-1 text-xs leading-5 text-[#6E6658]">
                Expired licences and registrations cannot be approved or used for verified access.
              </p>
            </div>
          )}
          <div>
            <Label>File</Label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            loading={uploading}
            disabled={
              !file ||
              (docType === "COMPANY_AUTHORIZATION" && !companyId) ||
              (EXPIRY_REQUIRED_TYPES.has(docType) && !expiryDate)
            }
          >
            Upload document
          </Button>
        </form>
      </Card>

      <h2 className="border-l-[3px] border-purple pl-3 font-display font-semibold text-navy">Submitted documents</h2>
      {documentsError && docs && (
        <ErrorState
          message={documentsError}
          onRetry={() => {
            setDocumentsError("");
            setDocumentsRetryCount((count) => count + 1);
          }}
        />
      )}
      {!docs && documentsError ? (
        <ErrorState
          message={documentsError}
          onRetry={() => {
            setDocumentsError("");
            setDocumentsRetryCount((count) => count + 1);
          }}
        />
      ) : !docs ? (
        <Loader />
      ) : docs.length === 0 ? (
        <Card className="border-[#E9E2EA]"><EmptyState title="No documents submitted yet" /></Card>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <Card key={d.id} className="border-[#E9E2EA]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">{d.docType.replaceAll("_", " ")}</p>
                  {d.companyId && (
                    <p className="mt-1 text-xs text-[#6E6658]">
                      Company: {companies.find((company) => company.id === d.companyId)?.companyName || "Selected company"}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#8C8496]">Submitted {format(new Date(d.createdAt), "d MMM yyyy")}</p>
                  {d.expiryDate && (
                    <p className="mt-1 text-xs text-[#8C8496]">
                      Expires {format(new Date(d.expiryDate), "d MMM yyyy")}
                    </p>
                  )}
                  {d.rejectionReason && <p className="text-xs text-red-500 mt-1">{d.rejectionReason}</p>}
                </div>
                <StatusBadge status={d.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
