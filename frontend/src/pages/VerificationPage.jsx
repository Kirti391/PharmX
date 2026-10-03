import { useEffect, useState } from "react";
import { http, api, apiErrorMessage } from "../lib/api";
import { Card, EmptyState, Label, Loader, Select, StatusBadge } from "../components/ui";
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
  const [uploading, setUploading] = useState(false);

  function load() {
    http.get("/verification/status").then(setDocs).catch(() => setDocs([]));
  }
  useEffect(load, []);

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
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-2">
        {isDoctor ? "Professional Registration Verification" : "Business Verification"}
      </h1>
      <p className="text-taupe text-sm mb-6">
        {isDoctor
          ? "Submit your medical registration for review. Doctors are only discoverable for professional requests after registration is verified and they opt in."
          : "Upload your business documents so an admin can verify your account. This unlocks the verified badge visible to other members."}
      </p>

      <Card className="mb-8">
        <form onSubmit={onSubmit} className="space-y-4">
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
              <p className="mt-1 text-xs text-taupe">
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
                className="w-full rounded-lg border border-taupedark/20 px-3.5 py-2.5 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/30"
              />
              <p className="mt-1 text-xs text-taupe">
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

      <h2 className="font-display font-semibold text-navy mb-4">Submitted documents</h2>
      {!docs ? (
        <Loader />
      ) : docs.length === 0 ? (
        <EmptyState title="No documents submitted yet" />
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy">{d.docType.replaceAll("_", " ")}</p>
                  {d.companyId && (
                    <p className="text-xs text-taupe">
                      Company: {companies.find((company) => company.id === d.companyId)?.companyName || "Selected company"}
                    </p>
                  )}
                  <p className="text-xs text-taupe">Submitted {format(new Date(d.createdAt), "d MMM yyyy")}</p>
                  {d.expiryDate && (
                    <p className="text-xs text-taupe">
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
