import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArrowLeft, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Card, ErrorState, Loader, StatusBadge } from "../components/ui";
import { Button, Label, TextArea } from "../components/ui";
import { OpportunityDescription } from "../components/opportunities/OpportunityDescription";
import { format } from "date-fns";

const TYPE_LABELS = {
  MR_HIRING: "MR Hiring",
  TERRITORY_EXPANSION: "Territory Expansion",
  DISTRIBUTION: "Distribution",
  PRODUCT_PROMOTION: "Product Promotion",
};

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [opportunity, setOpportunity] = useState(null);
  const [loadedOpportunityId, setLoadedOpportunityId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [applicationsError, setApplicationsError] = useState("");
  const [applicationActionError, setApplicationActionError] = useState("");
  const [applications, setApplications] = useState(null);
  const [applyState, setApplyState] = useState("idle");
  const [applyMessage, setApplyMessage] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [shareContactDetails, setShareContactDetails] = useState(false);
  const [opportunityActionError, setOpportunityActionError] = useState("");
  const [opportunityActionLoading, setOpportunityActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    http
      .get(`/opportunities/${id}`)
      .then((result) => {
        if (!mounted) return;
        setLoadError("");
        setLoadedOpportunityId(id);
        setOpportunity(result);
        setApplications(null);
        setApplicationsError("");
        setApplyState(result.applicationStatus ? "applied" : "idle");
        setApplicationMessage("");
        setShareContactDetails(false);

        if (user?.role === "PHARMA_COMPANY" && result.isOwner) {
          http
            .get(`/opportunities/${id}/applications`)
            .then((rows) => {
              if (mounted) setApplications(rows);
            })
            .catch((requestError) => {
              if (mounted) {
                setApplicationsError(
                  apiErrorMessage(
                    requestError,
                    "Unable to load applications."
                  )
                );
              }
            });
        }
      })
      .catch((requestError) => {
        if (mounted) {
          setOpportunity(null);
          setLoadError(
            apiErrorMessage(requestError, "Unable to load this opportunity.")
          );
          setLoadedOpportunityId(id);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, user?.role, reloadCount]);

  async function apply(event) {
    event.preventDefault();
    setApplyState("loading");
    try {
      await http.post(`/opportunities/${id}/apply`, {
        message: applicationMessage,
        shareContactDetails,
      });
      setApplyState("applied");
    } catch (err) {
      if (err?.response?.data?.error?.code === "ALREADY_APPLIED") {
        setApplyState("applied");
        return;
      }
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

  async function changeOpportunityStatus() {
    const status = opportunity.status === "OPEN" ? "CLOSED" : "OPEN";
    setOpportunityActionError("");
    setOpportunityActionLoading(true);
    try {
      const updated = await http.patch(`/opportunities/${id}`, { status });
      setOpportunity((current) => ({ ...current, ...updated }));
    } catch (requestError) {
      setOpportunityActionError(
        apiErrorMessage(requestError, "Unable to update this opportunity.")
      );
    } finally {
      setOpportunityActionLoading(false);
    }
  }

  async function deleteOpportunity() {
    if (
      !window.confirm(
        `Delete "${opportunity.title}"? This will also remove its applications.`
      )
    ) {
      return;
    }
    setOpportunityActionError("");
    setOpportunityActionLoading(true);
    try {
      await http.delete(`/opportunities/${id}`);
      navigate("/opportunities", { replace: true });
    } catch (requestError) {
      setOpportunityActionError(
        apiErrorMessage(requestError, "Unable to delete this opportunity.")
      );
    } finally {
      setOpportunityActionLoading(false);
    }
  }

  if (loading && loadedOpportunityId !== id) return <Loader />;
  if (loadedOpportunityId === id && !opportunity && loadError) {
    return (
      <ErrorState
        message={loadError}
        onRetry={() => {
          setLoadError("");
          setLoadedOpportunityId(null);
          setLoading(true);
          setReloadCount((count) => count + 1);
        }}
      />
    );
  }
  if (loadedOpportunityId !== id || !opportunity) return <Loader />;

  const canApply = user?.role === "MR" || user?.role === "INDEPENDENT_MR";
  const canManage =
    user?.role === "PHARMA_COMPANY" && opportunity.isOwner === true;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-2 font-nav text-[10px] uppercase tracking-[0.12em] text-[#8C8496] transition hover:text-[#44318D]"
      >
        <ArrowLeft size={14} />
        Back to opportunities
      </Link>

      <Card className="overflow-hidden border-[#E9E2EA] p-0">
        <div className="h-1 bg-gradient-to-r from-[#D83F87] via-[#44318D] to-[#E98074]" />
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-[#EFEBF9] px-3 py-1.5 font-nav text-[9px] uppercase tracking-[0.1em] text-purple">
                {TYPE_LABELS[opportunity.type] || "Opportunity"}
              </span>
              <h1 className="mt-4 break-words font-display text-2xl font-semibold leading-tight text-navy sm:text-3xl">
                {opportunity.title}
              </h1>
              <p className="mt-2 text-xs text-[#8C8496]">
                Posted {format(new Date(opportunity.createdAt), "d MMM yyyy")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge status={opportunity.status} />
              {canManage && (
                <>
                  <Link
                    to={`/opportunities/${id}/edit`}
                    className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#E9E2EA] px-3 font-nav text-[9px] uppercase tracking-[0.1em] text-[#44318D] transition hover:bg-[#F7F5FA]"
                  >
                    <Pencil size={14} />
                    Edit
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={opportunityActionLoading}
                    onClick={changeOpportunityStatus}
                  >
                    {opportunity.status === "OPEN" ? (
                      <Archive size={14} />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    {opportunity.status === "OPEN" ? "Close" : "Reopen"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={opportunityActionLoading}
                    onClick={deleteOpportunity}
                    aria-label="Delete opportunity"
                  >
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {opportunityActionError && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {opportunityActionError}
            </p>
          )}

          <section className="mt-7 rounded-2xl border border-[#E9E2EA] bg-[#FCFAFD] p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-navy">
              Opportunity details
            </h2>
            <div className="mt-4">
              <OpportunityDescription
                description={opportunity.description}
              />
            </div>
          </section>

          {(opportunity.categories?.length > 0 ||
            opportunity.territories?.length > 0) && (
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {opportunity.categories?.length > 0 && (
                <section>
                  <h2 className="font-nav text-[9px] uppercase tracking-[0.14em] text-[#8C8496]">
                    Product categories
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {opportunity.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-[#F8F2F5] px-3 py-1.5 text-xs text-primary"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              {opportunity.territories?.length > 0 && (
                <section>
                  <h2 className="font-nav text-[9px] uppercase tracking-[0.14em] text-[#8C8496]">
                    Territories
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {opportunity.territories.map((territory) => (
                      <span
                        key={territory}
                        className="rounded-full bg-[#F1EEF2] px-3 py-1.5 text-xs text-[#6E6658]"
                      >
                        {territory}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {canApply && applyState === "applied" && (
            <div className="mt-6 border-t border-[#E9E2EA] pt-5">
              <Button variant="ghost" disabled>
                Applied
              </Button>
            </div>
          )}

          {canApply && opportunity.status !== "OPEN" && applyState !== "applied" && (
            <p className="mt-6 border-t border-[#E9E2EA] pt-5 text-sm text-[#8C8496]">
              This opportunity is no longer accepting applications.
            </p>
          )}

          {canApply && opportunity.status === "OPEN" && applyState !== "applied" && (
            <div className="mt-6 border-t border-[#E9E2EA] pt-5">
              <form className="space-y-4" onSubmit={apply}>
                <div>
                  <Label htmlFor="application-message">
                    Note to the company (optional)
                  </Label>
                  <TextArea
                    id="application-message"
                    rows={4}
                    maxLength={2000}
                    value={applicationMessage}
                    onChange={(event) =>
                      setApplicationMessage(event.target.value)
                    }
                    placeholder="Briefly introduce yourself and explain your interest."
                  />
                </div>
                <label className="flex items-start gap-2.5 text-sm leading-5 text-[#6E6658]">
                  <input
                    type="checkbox"
                    required
                    checked={shareContactDetails}
                    onChange={(event) =>
                      setShareContactDetails(event.target.checked)
                    }
                    className="mt-1 accent-[#D83F87]"
                  />
                  <span>
                    I agree to share my MR profile, career preferences, email,
                    and phone number with the company that posted this
                    opportunity. My safety preferences are not shared.
                  </span>
                </label>
                <Button type="submit" loading={applyState === "loading"}>
                  Apply to this opportunity
                </Button>
              </form>
              {applyState === "error" && (
                <p className="mt-2 text-sm text-red-500">{applyMessage}</p>
              )}
            </div>
          )}
        </div>
      </Card>

      {canManage && applicationsError && (
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
      {canManage && applications && (
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
                      <p className="text-sm font-medium text-navy">
                        {a.applicant?.fullName || "Medical representative"}
                      </p>
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
                  <div className="mt-4 grid gap-2 border-t border-[#E9E2EA] pt-4 text-sm text-[#6E6658] sm:grid-cols-2">
                    <p>Email: <span className="font-medium text-navy">{a.applicant?.email || "Not provided"}</span></p>
                    <p>Phone: <span className="font-medium text-navy">{a.applicant?.mobile || "Not provided"}</span></p>
                    <p>Experience: <span className="font-medium text-navy">{a.applicant?.experienceYears || 0} years</span></p>
                    <p>Territories: <span className="font-medium text-navy">{a.applicant?.territories?.join(", ") || "Not specified"}</span></p>
                    <p className="sm:col-span-2">
                      Career interests:{" "}
                      <span className="font-medium text-navy">
                        {a.applicant?.preferredOpportunityTypes
                          ?.map((type) => type.replaceAll("_", " "))
                          .join(", ") || "Not specified"}
                      </span>
                    </p>
                    {a.message && (
                      <p className="sm:col-span-2">
                        Note: <span className="font-medium text-navy">{a.message}</span>
                      </p>
                    )}
                    {a.applicant?.bio && (
                      <p className="sm:col-span-2">{a.applicant.bio}</p>
                    )}
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
