import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, Loader, StatusBadge } from "../components/ui";
import { Button } from "../components/ui";
import { format } from "date-fns";

const TYPE_LABELS = {
  MR_HIRING: "MR Hiring",
  TERRITORY_EXPANSION: "Territory Expansion",
  DISTRIBUTION: "Distribution",
  PRODUCT_PROMOTION: "Product Promotion",
};

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState(null);
  const [applyState, setApplyState] = useState("idle");
  const [applyMessage, setApplyMessage] = useState(null);

  useEffect(() => {
    http.get(`/opportunities/${id}`).then(setOpportunity).catch(() => {});
    if (user?.role === "PHARMA_COMPANY") {
      http
        .get(`/opportunities/${id}/applications`)
        .then(setApplications)
        .catch(() => setApplications(null));
    }
  }, [id, user?.role]);

  async function apply() {
    setApplyState("loading");
    try {
      await http.post(`/opportunities/${id}/apply`);
      setApplyState("applied");
    } catch (err) {
      setApplyState("error");
      setApplyMessage(apiErrorMessage(err, "Failed to apply"));
    }
  }

  async function updateApplication(appId, status) {
    await http.patch(`/opportunities/${id}/applications/${appId}`, { status });
    setApplications((prev) => prev?.map((a) => (a.id === appId ? { ...a, status } : a)) ?? null);
  }

  if (!opportunity) return <Loader />;

  const canApply = user?.role === "MR" || user?.role === "INDEPENDENT_MR";

  return (
    <div className="max-w-3xl">
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-medium bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">{TYPE_LABELS[opportunity.type]}</span>
            <h1 className="font-display text-xl font-semibold text-navy mt-3">{opportunity.title}</h1>
            <p className="text-xs text-taupe mt-1">Posted {format(new Date(opportunity.createdAt), "d MMM yyyy")}</p>
          </div>
          <StatusBadge status={opportunity.status} />
        </div>
        <p className="text-taupedark mt-4 leading-relaxed">{opportunity.description}</p>
        <div className="flex flex-wrap gap-1.5 mt-4">
          {opportunity.categories.map((c) => (
            <span key={c} className="text-xs bg-sage/15 text-tealdeep px-2 py-0.5 rounded-full">
              {c}
            </span>
          ))}
          {opportunity.territories.map((t) => (
            <span key={t} className="text-xs bg-taupe/15 text-taupedark px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
        </div>

        {canApply && (
          <div className="mt-6 pt-5 border-t border-taupedark/10">
            {applyState === "applied" ? (
              <p className="text-tealdeep text-sm font-medium">Application submitted ✓</p>
            ) : (
              <Button onClick={apply} loading={applyState === "loading"}>
                Apply to this opportunity
              </Button>
            )}
            {applyState === "error" && <p className="text-red-500 text-sm mt-2">{applyMessage}</p>}
          </div>
        )}
      </Card>

      {user?.role === "PHARMA_COMPANY" && applications && (
        <div>
          <h2 className="font-display font-semibold text-navy mb-4">Applications ({applications.length})</h2>
          {applications.length === 0 ? (
            <p className="text-taupe text-sm">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-navy">Applicant user {a.applicantUserId.toString().slice(0, 8)}…</p>
                      <p className="text-xs text-taupe">Applied {format(new Date(a.appliedAt), "d MMM yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} />
                      {a.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => updateApplication(a.id, "SHORTLISTED")}>
                            Shortlist
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => updateApplication(a.id, "REJECTED")}>
                            Reject
                          </Button>
                        </>
                      )}
                      {a.status === "SHORTLISTED" && (
                        <Button size="sm" onClick={() => updateApplication(a.id, "ACCEPTED")}>
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
