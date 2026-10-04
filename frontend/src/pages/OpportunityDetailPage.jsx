import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, ErrorState, Loader, StatusBadge } from "../components/ui";
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationActionError, setApplicationActionError] = useState("");
  const [applications, setApplications] = useState(null);
  const [applyState, setApplyState] = useState("idle");
  const [applyMessage, setApplyMessage] = useState(null);

  useEffect(() => {
    http
      .get(`/opportunities/${id}`)
      .then(setOpportunity)
      .catch((requestError) => {
        setLoadError(
          apiErrorMessage(requestError, "Unable to load this opportunity.")
        );
      })
      .finally(() => setLoading(false));
    if (user?.role === "PHARMA_COMPANY") {
      http
        .get(`/opportunities/${id}/applications`)
        .then(setApplications)
        .catch((requestError) => {
          setApplicationsError(
            apiErrorMessage(requestError, "Unable to load applications.")
          );
        });
    }
  }, [id, user?.role, reloadCount]);

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
    setApplicationActionError("");
    try {
      await http.patch(`/opportunities/${id}/applications/${appId}`, { status });
      setApplications((prev) => prev?.map((a) => (a.id === appId ? { ...a, status } : a)) ?? null);
    } catch (requestError) {
      setApplicationActionError(
        apiErrorMessage(requestError, "Unable to update this application.")
      );
    }
  }

  if (loading && !opportunity) return <Loader />;
  if (!opportunity && loadError) {
    return (
      <ErrorState
        message={loadError}
        onRetry={() => {
          setLoadError("");
          setLoading(true);
          setReloadCount((count) => count + 1);
        }}
      />
    );
  }
  if (!opportunity) return <Loader />;

  const canApply = user?.role === "MR" || user?.role === "INDEPENDENT_MR";

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="border-[#E9E2EA] p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-[#EFEBF9] px-3 py-1 font-nav text-[9px] uppercase tracking-[0.1em] text-purple">{TYPE_LABELS[opportunity.type]}</span>
            <h1 className="mt-3 font-display text-xl font-semibold text-navy sm:text-2xl">{opportunity.title}</h1>
            <p className="mt-1 text-xs text-[#8C8496]">Posted {format(new Date(opportunity.createdAt), "d MMM yyyy")}</p>
          </div>
          <StatusBadge status={opportunity.status} />
        </div>
        <p className="mt-4 leading-7 text-[#6E6658]">{opportunity.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {opportunity.categories.map((c) => (
            <span key={c} className="rounded-full bg-[#F8F2F5] px-3 py-1 text-xs text-primary">
              {c}
            </span>
          ))}
          {opportunity.territories.map((t) => (
            <span key={t} className="rounded-full bg-[#F1EEF2] px-3 py-1 text-xs text-[#6E6658]">
              {t}
            </span>
          ))}
        </div>

        {canApply && (
          <div className="mt-6 border-t border-[#E9E2EA] pt-5">
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

      {user?.role === "PHARMA_COMPANY" && applicationsError && (
        <ErrorState
          title="Unable to load applications"
          message={applicationsError}
          onRetry={() => {
            setApplicationsError("");
            setApplications(null);
            setReloadCount((count) => count + 1);
          }}
        />
      )}
      {user?.role === "PHARMA_COMPANY" && applications && (
        <div className="space-y-4">
          <h2 className="border-l-[3px] border-primary pl-3 font-display font-semibold text-navy">Applications <span className="font-nav text-xs text-[#8C8496]">({applications.length})</span></h2>
          {applicationActionError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{applicationActionError}</p>}
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
                    <div className="flex flex-wrap items-center gap-2">
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
