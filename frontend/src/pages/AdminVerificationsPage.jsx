import { useEffect, useState } from "react";
import { http, API_URL } from "../lib/api";
import { Button, Card, EmptyState, Loader } from "../components/ui";
import { format } from "date-fns";

export default function AdminVerificationsPage() {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  function load() {
    http
      .get("/admin/verifications?status=PENDING")
      .then(setDocs)
      .catch(() => {
        setError("Unable to load pending verification documents.");
        setDocs([]);
      });
  }
  useEffect(load, []);

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
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-2">Pending Verification Documents</h1>
      <p className="text-taupe text-sm mb-6">Review each submitted document independently. An approved document does not automatically verify unrelated business or identity records.</p>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

      {!docs ? (
        <Loader />
      ) : docs.length === 0 ? (
        <EmptyState title="No pending documents" subtitle="You're all caught up." />
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-navy">{d.docType.replaceAll("_", " ")}</p>
                  <p className="text-xs text-taupe">
                    User {d.userId.toString().slice(0, 8)}… · submitted {format(new Date(d.createdAt), "d MMM yyyy")}
                  </p>
                  {d.expiryDate && (
                    <p className="text-xs text-taupe">
                      Expires {format(new Date(d.expiryDate), "d MMM yyyy")}
                    </p>
                  )}
                  {d.companyId && (
                    <p className="text-xs text-taupe">
                      Linked company {d.companyId.toString().slice(0, 8)}…
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={d.fileUrl.startsWith("http") ? d.fileUrl : `${API_URL}${d.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-tealdeep text-sm font-medium"
                  >
                    View file
                  </a>
                  <Button
                    size="sm"
                    disabled={busyId === d.id}
                    onClick={() => review(d, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={busyId === d.id}
                    onClick={() => review(d, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
