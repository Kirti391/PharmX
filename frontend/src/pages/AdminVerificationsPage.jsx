import { useEffect, useState } from "react";
import { http, API_URL } from "../lib/api";
import { Card, EmptyState, Loader } from "../components/ui";
import { format } from "date-fns";

export default function AdminVerificationsPage() {
  const [docs, setDocs] = useState(null);

  useEffect(() => {
    http.get("/admin/verifications?status=PENDING").then(setDocs).catch(() => setDocs([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-navy mb-2">Pending Verification Documents</h1>
      <p className="text-taupe text-sm mb-6">Review submitted documents here, then approve or reject the account from the Users page.</p>

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
                </div>
                <a
                  href={d.fileUrl.startsWith("http") ? d.fileUrl : `${API_URL}${d.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-tealdeep text-sm font-medium"
                >
                  View file
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
