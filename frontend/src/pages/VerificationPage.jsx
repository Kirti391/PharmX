import { useEffect, useState } from "react";
import { http, api, apiErrorMessage } from "../lib/api";
import { Card, EmptyState, Label, Loader, Select, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { format } from "date-fns";

const DOC_TYPES = ["DRUG_LICENSE", "GST", "ID_PROOF", "BUSINESS_REG", "OTHER"];

export default function VerificationPage() {
  const [docs, setDocs] = useState(null);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  function load() {
    http.get("/verification/status").then(setDocs).catch(() => setDocs([]));
  }
  useEffect(load, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("docType", docType);
      formData.append("file", file);
      await api.post("/verification/documents", formData);
      setFile(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-navy mb-2">Business Verification</h1>
      <p className="text-taupe text-sm mb-6">
        Upload your business documents so an admin can verify your account. This unlocks the "verified" badge visible to other members.
      </p>

      <Card className="mb-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Document type</Label>
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>File</Label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" loading={uploading} disabled={!file}>
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
                  <p className="text-xs text-taupe">Submitted {format(new Date(d.createdAt), "d MMM yyyy")}</p>
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
