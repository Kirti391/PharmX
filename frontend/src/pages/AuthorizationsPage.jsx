import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Loader,
  Select,
  StatusBadge,
} from "../components/ui";
import { apiErrorMessage, http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { PRODUCT_CATEGORIES } from "../lib/constants";

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export default function AuthorizationsPage() {
  const user = useAuthStore((state) => state.user);
  const isMR = user?.role === "MR";
  const isCompany = user?.role === "PHARMA_COMPANY";
  const [authorizations, setAuthorizations] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [categories, setCategories] = useState([]);
  const [authorizedTerritories, setAuthorizedTerritories] = useState([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");

  function loadAuthorizations() {
    http
      .get("/authorizations")
      .then((rows) =>
        setAuthorizations(Array.isArray(rows) ? rows : [])
      )
      .catch((requestError) => {
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load company authorizations."
          )
        );
        setAuthorizations([]);
      });
  }

  useEffect(() => {
    loadAuthorizations();
    if (!isMR) return;

    Promise.all([
      http.get("/discover/companies"),
      http.get("/verification/status"),
      http.get("/profiles/mr/me"),
    ])
      .then(([companyRows, documentRows, profile]) => {
        const verifiedCompanies = (
          Array.isArray(companyRows) ? companyRows : []
        ).filter(
          (company) =>
            company.businessVerified &&
            company.verificationStatus === "VERIFIED"
        );
        setCompanies(verifiedCompanies);
        setDocuments(
          (Array.isArray(documentRows) ? documentRows : []).filter(
            (document) =>
              document.docType === "COMPANY_AUTHORIZATION" &&
              document.status === "APPROVED"
          )
        );
        setTerritories(
          Array.isArray(profile.territories)
            ? profile.territories
            : []
        );
      })
      .catch((requestError) =>
        setError(
          apiErrorMessage(
            requestError,
            "Unable to load verified companies, authorization documents, or your territories."
          )
        )
      );
  }, [isMR]);

  const companyDocuments = documents.filter(
    (document) => document.companyId === companyId
  );

  async function requestAuthorization(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await http.post("/authorizations", {
        companyId,
        verificationDocumentId: documentId,
        categories,
        territories: authorizedTerritories,
        expiresAt: new Date(`${expiresAt}T23:59:59.000Z`).toISOString(),
      });
      setDocumentId("");
      setCategories([]);
      setAuthorizedTerritories([]);
      setExpiresAt("");
      loadAuthorizations();
    } catch (requestError) {
      setError(
        apiErrorMessage(
          requestError,
          "Unable to request company authorization."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function reviewAuthorization(authorization, action) {
    const reason =
      action === "reject"
        ? window.prompt("Enter a reason for declining this request:")
        : null;
    if (action === "reject" && !reason?.trim()) return;
    if (
      action === "revoke" &&
      !window.confirm(
        "Revoke this MR authorization? They will immediately lose access to company-scoped activities."
      )
    ) {
      return;
    }

    setError("");
    setBusyId(authorization.id);
    try {
      await http.patch(
        `/authorizations/${authorization.id}/${action}`,
        action === "reject" ? { reason } : undefined
      );
      loadAuthorizations();
    } catch (requestError) {
      setError(
        apiErrorMessage(
          requestError,
          "Unable to update this authorization."
        )
      );
    } finally {
      setBusyId("");
    }
  }

  if (!isMR && !isCompany) {
    return (
      <EmptyState
        title="Authorizations are role restricted"
        subtitle="This workspace is available to medical representatives and pharmaceutical companies."
      />
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-10">
      <header>
        <p className="workspace-label text-[#D83F87]">
          Trust and representation
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy">
          {isMR ? "Company authorizations" : "MR authorizations"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-taupe">
          {isMR
            ? "Request company-scoped representation only after your authorization letter has been reviewed. Active authorizations are limited to the approved categories and territories."
            : "Review MR representation requests backed by an approved authorization document. Approving grants access only to the listed categories and territories."}
        </p>
      </header>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {isMR && (
        <Card className="p-5 sm:p-7">
          <h2 className="font-display text-lg font-semibold text-navy">
            Request representation authorization
          </h2>
          {companies.length === 0 ? (
            <p className="mt-3 text-sm text-taupe">
              No verified pharmaceutical companies are available yet.
            </p>
          ) : companyId && companyDocuments.length === 0 ? (
            <p className="mt-3 text-sm text-taupe">
              First upload an authorization letter for a verified company and
              wait for admin review.{" "}
              <Link to="/verification" className="font-medium text-purple underline">
                Open document verification
              </Link>
            </p>
          ) : (
            <form onSubmit={requestAuthorization} className="mt-5 space-y-5">
              <div>
                <Label>Company</Label>
                <Select
                  required
                  value={companyId}
                  onChange={(event) => {
                    setCompanyId(event.target.value);
                    setDocumentId("");
                  }}
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Approved authorization document</Label>
                <Select
                  required
                  value={documentId}
                  onChange={(event) => setDocumentId(event.target.value)}
                >
                  <option value="">Select a reviewed document</option>
                  {companyDocuments.map((document) => (
                    <option key={document.id} value={document.id}>
                      Submitted {new Date(document.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Authorized product categories</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CATEGORIES.map((category) => {
                    const selected = categories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setCategories((current) =>
                            toggleValue(current, category)
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-xs ${
                          selected
                            ? "border-purple bg-purple/10 text-purple"
                            : "border-taupe/30 text-taupedark"
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label>Authorized territories</Label>
                {territories.length === 0 ? (
                  <p className="text-sm text-red-600">
                    Add territories to your MR profile before requesting
                    authorization.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {territories.map((territory) => {
                      const selected =
                        authorizedTerritories.includes(territory);
                      return (
                        <button
                          key={territory}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setAuthorizedTerritories((current) =>
                              toggleValue(current, territory)
                            )
                          }
                          className={`rounded-full border px-3 py-2 text-xs ${
                            selected
                              ? "border-purple bg-purple/10 text-purple"
                              : "border-taupe/30 text-taupedark"
                          }`}
                        >
                          {territory}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="max-w-xs">
                <Label>Authorization expiry</Label>
                <Input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                loading={busy}
                disabled={
                  !companyId ||
                  !documentId ||
                  categories.length === 0 ||
                  authorizedTerritories.length === 0 ||
                  !expiresAt
                }
              >
                Submit authorization request
              </Button>
            </form>
          )}
        </Card>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-navy">
          {isMR ? "Your authorizations" : "Company representation requests"}
        </h2>
        {!authorizations ? (
          <Loader />
        ) : authorizations.length === 0 ? (
          <EmptyState
            title="No authorization records"
            subtitle={
              isMR
                ? "Your requests and active representation scopes will appear here."
                : "MR requests for your company will appear here."
            }
          />
        ) : (
          <div className="space-y-3">
            {authorizations.map((authorization) => (
              <Card key={authorization.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">
                      {isMR
                        ? authorization.companyName
                        : authorization.mr?.name || "Medical representative"}
                    </p>
                    <p className="mt-1 text-xs text-taupe">
                      {authorization.categories.join(", ")} ·{" "}
                      {authorization.territories.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-taupe">
                      Expires{" "}
                      {new Date(authorization.expiresAt).toLocaleDateString()}
                    </p>
                    {authorization.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">
                        {authorization.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={authorization.status} />
                    {isCompany &&
                      authorization.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            disabled={busyId === authorization.id}
                            onClick={() =>
                              reviewAuthorization(authorization, "approve")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={busyId === authorization.id}
                            onClick={() =>
                              reviewAuthorization(authorization, "reject")
                            }
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    {isCompany &&
                      authorization.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busyId === authorization.id}
                          onClick={() =>
                            reviewAuthorization(authorization, "revoke")
                          }
                        >
                          Revoke
                        </Button>
                      )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
