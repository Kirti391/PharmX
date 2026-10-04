import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  MessageCircle,
  MoreHorizontal,
  PackageSearch,
  Pencil,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import {
  Card,
  Loader,
  StatusBadge,
  Button,
  TextArea,
} from "../components/ui";
import { ConnectButton } from "../components/discovery";

const colors = {
  navy: "#2A1B3D",
  purple: "#44318D",
  pink: "#D83F87",
  coral: "#E98074",
  muted: "#8C8496",
  background: "#FCFAF8",
  border: "#E9E2EA",
};

/*
|--------------------------------------------------------------------------
| Role Helpers
|--------------------------------------------------------------------------
*/

function normalizeRole(role) {
  if (!role) return null;

  const value = String(role).toUpperCase();

  if (
    value === "DISTRIBUTOR" ||
    value === "STOCKIST" ||
    value === "DISTRIBUTOR_STOCKIST"
  ) {
    return "DISTRIBUTOR_STOCKIST";
  }

  if (
    value === "COMPANY" ||
    value === "PHARMA_COMPANY"
  ) {
    return "COMPANY";
  }

  if (value === "MR") {
    return "MR";
  }

  if (value === "PHARMACY") {
    return "PHARMACY";
  }

  return value;
}

function getTargetRoleLabel(role) {
  const value = normalizeRole(role);

  if (value === "COMPANY") {
    return "Pharma Companies";
  }

  if (value === "MR") {
    return "Medical Representatives";
  }

  if (value === "DISTRIBUTOR_STOCKIST") {
    return "Distributors & Stockists";
  }

  if (value === "PHARMACY") {
    return "Pharmacies";
  }

  return "Relevant business profiles";
}

function getMatchTypeLabel(type) {
  const value = String(type || "")
    .replaceAll("_", " ")
    .toLowerCase();

  if (value.includes("company")) {
    return "Pharma Company";
  }

  if (value.includes("mr")) {
    return "Medical Representative";
  }

  if (
    value.includes("stock") ||
    value.includes("distributor")
  ) {
    return "Distributor / Stockist";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getMatchInitials(name) {
  if (!name) return "P";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function getMatchScore(score) {
  if (typeof score !== "number") {
    return null;
  }

  const normalized =
    score <= 1
      ? score * 100
      : score;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(normalized)
    )
  );
}

/*
|--------------------------------------------------------------------------
| Procurement Progress
|--------------------------------------------------------------------------
*/

function getProgress(status) {
  const steps = [
    {
      key: "OPEN",
      label: "Requirement posted",
    },
    {
      key: "MATCHING",
      label: "Matching suppliers",
    },
    {
      key: "CONNECTED",
      label: "Supplier connection",
    },
    {
      key: "FULFILLED",
      label: "Procurement fulfilled",
    },
  ];

  const statusMap = {
    OPEN: 0,
    MATCHING: 1,
    SHORTLISTED: 1,
    RESPONSES: 1,
    CONNECTED: 2,
    FULFILLED: 3,
    CLOSED: 3,
  };

  return {
    steps,
    currentIndex:
      statusMap[status] ?? 0,
  };
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function RequirementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore(
    (state) => state.user
  );

  const [requirement, setRequirement] =
    useState(null);

  /*
   * null = matches have not been loaded yet.
   * []   = owner loaded matches and there are none.
   */
  const [matches, setMatches] =
    useState(null);

  const [matchesPrivate, setMatchesPrivate] =
    useState(false);

  const [responses, setResponses] = useState(null);

  const [myResponse, setMyResponse] = useState(undefined);

  const [responseMessage, setResponseMessage] = useState("");

  const [responseError, setResponseError] = useState("");

  const [submittingResponse, setSubmittingResponse] = useState(false);

  const [loadingDelete, setLoadingDelete] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [selectedMatch, setSelectedMatch] =
    useState(null);

  const [error, setError] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Requirement
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Matching profiles are private to the requirement owner.
  |
  | We therefore:
  |
  | 1. Load the requirement.
  | 2. Determine ownership from the response.
  | 3. Only if the current user is the owner, call the matching endpoint.
  |
  | The backend still enforces the same rule. This frontend check simply
  | prevents unnecessary/private requests from being made by other users.
  |
  */

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setError("");
        setRequirement(null);
        setMatches(null);
        setMatchesPrivate(false);
        setSelectedMatch(null);
        setResponses(null);
        setMyResponse(undefined);
        setResponseError("");

        const requirementData =
          await http.get(
            `/requirements/${id}`
          );

        if (!mounted) return;

        setRequirement(
          requirementData
        );

        /*
         * Determine ownership from the requirement response.
         *
         * The backend should provide isOwner.
         * owner.isCurrentUser is kept as a compatibility fallback.
         */
        const owner =
          requirementData?.isOwner === true ||
          requirementData?.owner?.isCurrentUser === true;

        /*
         * SECURITY / PRIVACY:
         *
         * Non-owners do not call the matching endpoint.
         *
         * They can see the requirement if the requirement route
         * considers them eligible, but they cannot receive:
         *
         * - matched profiles
         * - match scores
         * - matching reasons
         */
        if (!owner) {
          setMatchesPrivate(true);
          setMatches(null);
          if (requirementData?.isTargetRole) {
            try {
              const ownResponse = await http.get(
                `/requirements/${id}/my-response`
              );
              if (mounted) setMyResponse(ownResponse);
            } catch (responseLoadError) {
              if (mounted) {
                setResponseError(
                  apiErrorMessage(
                    responseLoadError,
                    "Unable to check your existing response."
                  )
                );
              }
            }
          }
          return;
        }

        try {
          const responseRows = await http.get(
            `/requirements/${id}/responses`
          );
          if (mounted) {
            setResponses(Array.isArray(responseRows) ? responseRows : []);
          }
        } catch (responseLoadError) {
          if (mounted) {
            setResponseError(
              apiErrorMessage(
                responseLoadError,
                "Unable to load supplier responses."
              )
            );
          }
        }

        /*
         * Only the requirement owner reaches this request.
         */
        try {
          const matchesData =
            await http.get(
              `/matching/for-requirement/${id}`
            );

          if (!mounted) return;

          setMatches(
            Array.isArray(matchesData)
              ? matchesData
              : []
          );

          setMatchesPrivate(false);
        } catch (matchError) {
          console.error(
            "Load requirement matches error:",
            matchError
          );

          if (!mounted) return;

          /*
           * Backend security should return 403 if ownership
           * is not accepted.
           */
          if (
            matchError?.response?.status ===
            403
          ) {
            setMatchesPrivate(true);
          }

          /*
           * Match loading failure should not prevent the
           * requirement itself from being displayed.
           */
          setMatches([]);
        }
      } catch (err) {
        console.error(
          "Load requirement error:",
          err
        );

        if (mounted) {
          setError(
            apiErrorMessage(
              err,
              "Failed to load this requirement."
            )
          );
        }
      }
    }

    if (id) {
      load();
    } else {
      setError(
        "Requirement ID is missing."
      );
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  async function handleDelete() {
    setLoadingDelete(true);
    setError("");

    try {
      await http.delete(
        `/requirements/${id}`
      );

      navigate(
        "/requirements",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Delete requirement error:",
        err
      );

      setError(
        apiErrorMessage(
          err,
          "Failed to delete requirement."
        )
      );

      setLoadingDelete(false);
      setDeleteOpen(false);
    }
  }

  async function submitResponse(event) {
    event.preventDefault();
    if (submittingResponse || !responseMessage.trim()) return;

    setSubmittingResponse(true);
    setResponseError("");
    try {
      const response = await http.post(
        `/requirements/${id}/responses`,
        { message: responseMessage.trim() }
      );
      setMyResponse(response);
      setResponseMessage("");
    } catch (requestError) {
      setResponseError(
        apiErrorMessage(requestError, "Unable to send your response.")
      );
    } finally {
      setSubmittingResponse(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Permissions
  |--------------------------------------------------------------------------
  */

  const isOwner =
    requirement?.isOwner === true ||
    requirement?.owner?.isCurrentUser === true;

  const currentUserRole =
    normalizeRole(user?.role);

  const targetRole =
    normalizeRole(
      requirement?.targetRole
    );

  const canManage =
    isOwner &&
    currentUserRole === "PHARMACY" &&
    ![
      "FULFILLED",
      "CLOSED",
    ].includes(
      requirement?.status
    );

  /*
   * Matching data should only be usable by the owner.
   */
  const canViewMatches =
    isOwner && !matchesPrivate;

  const progress = useMemo(
    () =>
      getProgress(
        requirement?.status
      ),
    [requirement?.status]
  );

  /*
  |--------------------------------------------------------------------------
  | Filter Matches
  |--------------------------------------------------------------------------
  */

  const filteredMatches =
    useMemo(() => {
      if (
        !canViewMatches ||
        !Array.isArray(matches)
      ) {
        return [];
      }

      const query =
        search.trim().toLowerCase();

      if (!query) {
        return matches;
      }

      return matches.filter(
        (match) => {
          const searchable = [
            match?.name,
            match?.targetType,
            match?.companyName,
            match?.profileName,
            ...(Array.isArray(
              match?.reasons
            )
              ? match.reasons
              : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      matches,
      search,
      canViewMatches,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Load Error
  |--------------------------------------------------------------------------
  */

  if (error && !requirement) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card
          className="border"
          style={{
            backgroundColor: "#fff",
            borderColor: colors.border,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor:
                  `${colors.pink}12`,
                color: colors.pink,
              }}
            >
              <X size={20} />
            </div>

            <div>
              <h2
                className="text-lg font-semibold"
                style={{
                  color: colors.navy,
                  fontFamily:
                    '"Cinzel", serif',
                }}
              >
                Unable to load requirement
              </h2>

              <p
                className="mt-1 text-sm leading-6"
                style={{
                  color: colors.muted,
                  fontFamily:
                    '"Fauna One", serif',
                }}
              >
                {error}
              </p>

              <Link
                to="/requirements"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold"
                style={{
                  color: colors.purple,
                  fontFamily:
                    '"Unica One", sans-serif',
                }}
              >
                <ArrowLeft size={15} />
                Back to requirements
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!requirement) {
    return <Loader />;
  }

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/requirements"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
            style={{
              color: colors.purple,
              fontFamily:
                '"Unica One", sans-serif',
              letterSpacing: "0.04em",
            }}
          >
            <ArrowLeft size={15} />
            Requirements
          </Link>

          <ChevronRight
            size={14}
            style={{
              color: colors.muted,
            }}
          />

          <span
            style={{
              color: colors.muted,
              fontFamily:
                '"Fauna One", serif',
            }}
          >
            Requirement details
          </span>
        </div>

        {/* Header */}
        <Card
          className="overflow-hidden"
          style={{
            backgroundColor: "#fff",
            borderColor: colors.border,
          }}
        >
          <div
            className="h-1.5 w-full"
            style={{
              background:
                `linear-gradient(90deg, ${colors.pink}, ${colors.purple}, ${colors.coral})`,
            }}
          />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor:
                          `${colors.purple}12`,
                        color: colors.purple,
                        fontFamily:
                          '"Unica One", sans-serif',
                      }}
                    >
                      {requirement.category}
                    </span>

                    {requirement.urgency && (
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor:
                            requirement.urgency ===
                            "HIGH"
                              ? `${colors.pink}12`
                              : `${colors.muted}20`,
                          color:
                            requirement.urgency ===
                            "HIGH"
                              ? colors.pink
                              : colors.navy,
                          fontFamily:
                            '"Unica One", sans-serif',
                        }}
                      >
                        {requirement.urgency}{" "}
                        urgency
                      </span>
                    )}

                    {targetRole && (
                      <span
                        className="rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor:
                            `${colors.coral}15`,
                          color: colors.navy,
                          fontFamily:
                            '"Unica One", sans-serif',
                        }}
                      >
                        Seeking{" "}
                        {getTargetRoleLabel(
                          targetRole
                        )}
                      </span>
                    )}
                  </div>

                  <h1
                    className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl"
                    style={{
                      color: colors.navy,
                      fontFamily:
                        '"Cinzel", serif',
                    }}
                  >
                    {requirement.title}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {requirement.createdAt && (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs"
                        style={{
                          color: colors.muted,
                          fontFamily:
                            '"Fauna One", serif',
                        }}
                      >
                        <Clock3 size={13} />
                        Posted{" "}
                        {format(
                          new Date(
                            requirement.createdAt
                          ),
                          "d MMM yyyy"
                        )}
                      </span>
                    )}

                    {requirement.updatedAt &&
                      requirement.updatedAt !==
                        requirement.createdAt && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs"
                          style={{
                            color: colors.muted,
                            fontFamily:
                              '"Fauna One", serif',
                          }}
                        >
                          <Pencil size={12} />
                          Updated{" "}
                          {format(
                            new Date(
                              requirement.updatedAt
                            ),
                            "d MMM yyyy"
                          )}
                        </span>
                      )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge
                    status={
                      requirement.status
                    }
                  />
                </div>
              </div>

              {/* Target role explanation */}
              {targetRole && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor:
                      `${colors.purple}07`,
                    borderColor:
                      `${colors.purple}20`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor:
                          `${colors.purple}12`,
                        color:
                          colors.purple,
                      }}
                    >
                      <Users size={17} />
                    </div>

                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color:
                            colors.navy,
                          fontFamily:
                            '"Unica One", sans-serif',
                        }}
                      >
                        Looking for{" "}
                        {getTargetRoleLabel(
                          targetRole
                        )}
                      </p>

                      <p
                        className="mt-1 text-xs leading-5"
                        style={{
                          color:
                            colors.muted,
                          fontFamily:
                            '"Fauna One", serif',
                        }}
                      >
                        This requirement is shown
                        only to the selected business
                        role. Matching profiles remain
                        private to the requirement owner.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Procurement progress */}
              <div
                className="rounded-3xl border p-5 sm:p-6"
                style={{
                  backgroundColor:
                    colors.background,
                  borderColor:
                    colors.border,
                }}
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{
                        color: colors.navy,
                        fontFamily:
                          '"Unica One", sans-serif',
                        letterSpacing:
                          "0.04em",
                      }}
                    >
                      PROCUREMENT PROGRESS
                    </p>

                    <p
                      className="mt-1 text-xs"
                      style={{
                        color: colors.muted,
                        fontFamily:
                          '"Fauna One", serif',
                      }}
                    >
                      Track this requirement from
                      discovery to fulfilment.
                    </p>
                  </div>

                  <PackageSearch
                    size={21}
                    style={{
                      color: colors.purple,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {progress.steps.map(
                    (step, index) => {
                      const completed =
                        index <=
                        progress.currentIndex;

                      const active =
                        index ===
                        progress.currentIndex;

                      return (
                        <div
                          key={step.key}
                          className="relative"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                              style={{
                                backgroundColor:
                                  completed
                                    ? colors.purple
                                    : "#fff",
                                borderColor:
                                  completed
                                    ? colors.purple
                                    : colors.border,
                                color:
                                  completed
                                    ? "#fff"
                                    : colors.muted,
                              }}
                            >
                              {completed ? (
                                <Check
                                  size={16}
                                />
                              ) : (
                                <span className="text-xs font-semibold">
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-xs font-semibold"
                                style={{
                                  color:
                                    active
                                      ? colors.purple
                                      : colors.navy,
                                  fontFamily:
                                    '"Unica One", sans-serif',
                                }}
                              >
                                {step.label}
                              </p>

                              {active && (
                                <p
                                  className="mt-0.5 text-[11px]"
                                  style={{
                                    color:
                                      colors.muted,
                                    fontFamily:
                                      '"Fauna One", serif',
                                  }}
                                >
                                  Current stage
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Description */}
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor:
                    "#fff",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <FileText
                    size={17}
                    style={{
                      color:
                        colors.purple,
                    }}
                  />

                  <h2
                    className="text-sm font-semibold"
                    style={{
                      color:
                        colors.navy,
                      fontFamily:
                        '"Unica One", sans-serif',
                      letterSpacing:
                        "0.04em",
                    }}
                  >
                    REQUIREMENT DESCRIPTION
                  </h2>
                </div>

                <p
                  className="mt-3 whitespace-pre-line leading-7"
                  style={{
                    color:
                      colors.navy,
                    fontFamily:
                      '"Fauna One", serif',
                  }}
                >
                  {requirement.description}
                </p>
              </div>

              {/* Owner actions */}
              {canManage && (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor:
                      `${colors.pink}08`,
                    borderColor:
                      `${colors.pink}25`,
                  }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Pencil
                          size={16}
                          style={{
                            color:
                              colors.pink,
                          }}
                        />

                        <p
                          className="text-sm font-semibold"
                          style={{
                            color:
                              colors.navy,
                            fontFamily:
                              '"Unica One", sans-serif',
                          }}
                        >
                          Requirement management
                        </p>
                      </div>

                      <p
                        className="mt-1 text-xs"
                        style={{
                          color:
                            colors.muted,
                          fontFamily:
                            '"Fauna One", serif',
                        }}
                      >
                        Update procurement details
                        or remove this requirement.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/requirements/${id}/edit`}
                      >
                        <Button
                          type="button"
                          style={{
                            backgroundColor:
                              colors.purple,
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Pencil
                              size={15}
                            />
                            Edit requirement
                          </span>
                        </Button>
                      </Link>

                      <Button
                        type="button"
                        onClick={() =>
                          setDeleteOpen(
                            true
                          )
                        }
                        style={{
                          backgroundColor:
                            "#fff",
                          color:
                            colors.pink,
                          border: `1px solid ${colors.pink}40`,
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Trash2
                            size={15}
                          />
                          Delete
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="rounded-xl border p-3"
                  style={{
                    backgroundColor:
                      `${colors.pink}08`,
                    borderColor:
                      `${colors.pink}25`,
                  }}
                >
                  <p
                    className="text-sm"
                    style={{
                      color:
                        "#b42318",
                      fontFamily:
                        '"Fauna One", serif',
                    }}
                  >
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {isOwner && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} style={{ color: colors.purple }} />
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: colors.navy, fontFamily: '"Cinzel", serif' }}
                  >
                    Supplier responses
                  </h2>
                </div>
                <p
                  className="mt-1 text-sm"
                  style={{ color: colors.muted, fontFamily: '"Fauna One", serif' }}
                >
                  Replies from distributors and stockists are visible only to you.
                </p>
              </div>
              {responses && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: `${colors.purple}10`,
                    color: colors.purple,
                  }}
                >
                  {responses.length} {responses.length === 1 ? "response" : "responses"}
                </span>
              )}
            </div>

            {responseError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {responseError}
              </p>
            )}

            {responses === null ? (
              <Loader />
            ) : responses.length === 0 ? (
              <Card className="border" style={{ backgroundColor: "#fff", borderColor: colors.border }}>
                <p className="py-5 text-center text-sm" style={{ color: colors.muted }}>
                  No suppliers have responded yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {responses.map((response) => (
                  <Card
                    key={response.id}
                    className="border"
                    style={{ backgroundColor: "#fff", borderColor: colors.border }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold" style={{ color: colors.navy }}>
                          {response.responder?.name || "Supplier"}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: colors.muted }}>
                          {(response.responder?.role || "DISTRIBUTOR_STOCKIST").replaceAll("_", " ")}
                          {" · "}
                          {format(new Date(response.createdAt), "d MMM yyyy, p")}
                        </p>
                      </div>
                      <StatusBadge status={response.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{ color: colors.navy }}>
                      {response.message}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ============================================================
            MATCHING WORKSPACE
            ============================================================ */}

        {isOwner ? (
          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Users
                    size={19}
                    style={{
                      color:
                        colors.purple,
                    }}
                  />

                  <h2
                    className="text-xl font-semibold"
                    style={{
                      color:
                        colors.navy,
                      fontFamily:
                        '"Cinzel", serif',
                    }}
                  >
                    Matched profiles
                  </h2>
                </div>

                <p
                  className="mt-1 text-sm"
                  style={{
                    color:
                      colors.muted,
                    fontFamily:
                      '"Fauna One", serif',
                  }}
                >
                  Potential{" "}
                  {getTargetRoleLabel(
                    targetRole
                  ).toLowerCase()}{" "}
                  matched to this procurement
                  requirement.
                </p>
              </div>

              {Array.isArray(matches) &&
                matches.length > 0 && (
                  <div
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor:
                        `${colors.purple}10`,
                      color:
                        colors.purple,
                      fontFamily:
                        '"Unica One", sans-serif',
                    }}
                  >
                    {matches.length}{" "}
                    {matches.length === 1
                      ? "match"
                      : "matches"}
                  </div>
                )}
            </div>

            {/* Search */}
            {Array.isArray(matches) &&
              matches.length > 0 && (
                <div
                  className="mb-4 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3"
                  style={{
                    borderColor:
                      colors.border,
                  }}
                >
                  <Search
                    size={17}
                    style={{
                      color:
                        colors.muted,
                    }}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder={`Search matched ${getTargetRoleLabel(
                      targetRole
                    ).toLowerCase()}...`}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    style={{
                      color:
                        colors.navy,
                      fontFamily:
                        '"Fauna One", serif',
                    }}
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="rounded-full p-1 transition-opacity hover:opacity-60"
                      style={{
                        color:
                          colors.muted,
                      }}
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}

            {/* Private matching notice */}
            <div
              className="mb-4 rounded-2xl border p-4"
              style={{
                backgroundColor:
                  `${colors.purple}06`,
                borderColor:
                  `${colors.purple}20`,
              }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0"
                  style={{
                    color:
                      colors.purple,
                  }}
                />

                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color:
                        colors.navy,
                      fontFamily:
                        '"Unica One", sans-serif',
                    }}
                  >
                    Private matching workspace
                  </p>

                  <p
                    className="mt-1 text-xs leading-5"
                    style={{
                      color:
                        colors.muted,
                      fontFamily:
                        '"Fauna One", serif',
                    }}
                  >
                    Only you, as the requirement owner,
                    can view these matched profiles,
                    relevance scores and matching reasons.
                  </p>
                </div>
              </div>
            </div>

            {!matches ? (
              <Loader />
            ) : filteredMatches.length ===
              0 ? (
              <Card
                className="border"
                style={{
                  backgroundColor:
                    "#fff",
                  borderColor:
                    colors.border,
                }}
              >
                <div className="flex flex-col items-center px-6 py-10 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor:
                        `${colors.purple}10`,
                      color:
                        colors.purple,
                    }}
                  >
                    <Search
                      size={24}
                    />
                  </div>

                  <h3
                    className="mt-4 text-lg font-semibold"
                    style={{
                      color:
                        colors.navy,
                      fontFamily:
                        '"Cinzel", serif',
                    }}
                  >
                    {search
                      ? "No matching profiles found"
                      : "No strong matches yet"}
                  </h3>

                  <p
                    className="mt-2 max-w-md text-sm leading-6"
                    style={{
                      color:
                        colors.muted,
                      fontFamily:
                        '"Fauna One", serif',
                    }}
                  >
                    {search
                      ? "Try another name or clear the search to see all matches."
                      : `No suitable ${getTargetRoleLabel(
                          targetRole
                        ).toLowerCase()} have matched this requirement yet.`}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {filteredMatches.map(
                  (match) => {
                    const score =
                      getMatchScore(
                        match.score
                      );

                    const initials =
                      getMatchInitials(
                        match.name
                      );

                    return (
                      <Card
                        key={`${match.targetType}-${match.targetId}`}
                        className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                        style={{
                          backgroundColor:
                            "#fff",
                          borderColor:
                            colors.border,
                        }}
                      >
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold"
                              style={{
                                background:
                                  `linear-gradient(135deg, ${colors.purple}, ${colors.pink})`,
                                color:
                                  "#fff",
                                fontFamily:
                                  '"Unica One", sans-serif',
                              }}
                            >
                              {initials}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                  style={{
                                    backgroundColor:
                                      `${colors.muted}18`,
                                    color:
                                      colors.navy,
                                    fontFamily:
                                      '"Unica One", sans-serif',
                                  }}
                                >
                                  {getMatchTypeLabel(
                                    match.targetType
                                  )}
                                </span>

                                {score !==
                                  null && (
                                  <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                      backgroundColor:
                                        `${colors.pink}10`,
                                      color:
                                        colors.pink,
                                      fontFamily:
                                        '"Unica One", sans-serif',
                                    }}
                                  >
                                    {score}% match
                                  </span>
                                )}
                              </div>

                              <h3
                                className="mt-2 truncate text-base font-semibold"
                                style={{
                                  color:
                                    colors.navy,
                                  fontFamily:
                                    '"Fauna One", serif',
                                }}
                              >
                                {match.name ||
                                  "Matched profile"}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMatch(
                                  match
                                )
                              }
                              className="rounded-xl p-2 opacity-70 transition-all hover:opacity-100"
                              style={{
                                color:
                                  colors.muted,
                              }}
                              aria-label="View match details"
                            >
                              <MoreHorizontal
                                size={18}
                              />
                            </button>
                          </div>

                          {score !==
                            null && (
                            <div className="mt-5">
                              <div className="mb-1.5 flex items-center justify-between">
                                <span
                                  className="text-[11px]"
                                  style={{
                                    color:
                                      colors.muted,
                                    fontFamily:
                                      '"Unica One", sans-serif',
                                  }}
                                >
                                  MATCH RELEVANCE
                                </span>

                                <span
                                  className="text-[11px] font-semibold"
                                  style={{
                                    color:
                                      colors.purple,
                                    fontFamily:
                                      '"Unica One", sans-serif',
                                  }}
                                >
                                  {score}%
                                </span>
                              </div>

                              <div
                                className="h-1.5 overflow-hidden rounded-full"
                                style={{
                                  backgroundColor:
                                    `${colors.muted}25`,
                                }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width:
                                      `${score}%`,
                                    background:
                                      `linear-gradient(90deg, ${colors.purple}, ${colors.pink})`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {Array.isArray(
                            match.reasons
                          ) &&
                            match.reasons
                              .length >
                              0 && (
                              <div className="mt-4 space-y-2">
                                {match.reasons
                                  .slice(
                                    0,
                                    3
                                  )
                                  .map(
                                    (
                                      reason,
                                      index
                                    ) => (
                                      <div
                                        key={`${reason}-${index}`}
                                        className="flex items-start gap-2"
                                      >
                                        <CheckCircle2
                                          size={
                                            14
                                          }
                                          className="mt-0.5 shrink-0"
                                          style={{
                                            color:
                                              colors.coral,
                                          }}
                                        />

                                        <span
                                          className="text-xs leading-5"
                                          style={{
                                            color:
                                              colors.muted,
                                            fontFamily:
                                              '"Fauna One", serif',
                                          }}
                                        >
                                          {
                                            reason
                                          }
                                        </span>
                                      </div>
                                    )
                                  )}
                              </div>
                            )}

                          <div
                            className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4"
                            style={{
                              borderColor:
                                colors.border,
                            }}
                          >
                            {match.userId && (
                              <ConnectButton
                                recipientUserId={
                                  match.userId
                                }
                              />
                            )}

                            {match.userId && (
                              <Link
                                to={`/messages?user=${match.userId}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                                style={{
                                  borderColor:
                                    colors.border,
                                  color:
                                    colors.navy,
                                  fontFamily:
                                    '"Unica One", sans-serif',
                                }}
                              >
                                <MessageCircle
                                  size={14}
                                />
                                Message
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedMatch(
                                  match
                                )
                              }
                              className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-70"
                              style={{
                                color:
                                  colors.purple,
                                fontFamily:
                                  '"Unica One", sans-serif',
                              }}
                            >
                              View details
                              <ExternalLink
                                size={13}
                              />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                )}
              </div>
            )}
          </section>
        ) : (
          /*
           * Non-owner view.
           *
           * No matching endpoint is called and no matching
           * profile/score/reason data is rendered.
           */
          <section>
            <Card
              className="border"
              style={{
                backgroundColor:
                  "#fff",
                borderColor:
                  colors.border,
              }}
            >
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor:
                      `${colors.purple}10`,
                    color:
                      colors.purple,
                  }}
                >
                  <PackageSearch
                    size={27}
                  />
                </div>

                <h2
                  className="mt-5 text-xl font-semibold"
                  style={{
                    color:
                      colors.navy,
                    fontFamily:
                      '"Cinzel", serif',
                  }}
                >
                  {targetRole &&
                  currentUserRole === targetRole
                    ? "Requirement available to your role"
                    : "Requirement matching is private"}
                </h2>

                <p
                  className="mt-2 max-w-lg text-sm leading-6"
                  style={{
                    color:
                      colors.muted,
                    fontFamily:
                      '"Fauna One", serif',
                  }}
                >
                  {targetRole &&
                  currentUserRole === targetRole
                    ? `This requirement is intended for ${getTargetRoleLabel(
                        targetRole
                      ).toLowerCase()}. Respond to the pharmacy with the supply capability or availability you can provide.`
                    : "Matching profiles, match scores and matching reasons are visible only to the requirement owner."}
                </p>
                {currentUserRole === "DISTRIBUTOR_STOCKIST" &&
                  requirement.isTargetRole &&
                  requirement.status === "OPEN" &&
                  (myResponse ? (
                    <div className="mt-6 w-full max-w-lg rounded-2xl border p-4 text-left" style={{ borderColor: colors.border }}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold" style={{ color: colors.navy }}>Your response</p>
                        <StatusBadge status={myResponse.status} />
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6" style={{ color: colors.muted }}>
                        {myResponse.message}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={submitResponse} className="mt-6 w-full max-w-lg text-left">
                      <label htmlFor="requirement-response" className="mb-2 block text-sm font-semibold" style={{ color: colors.navy }}>
                        Tell the pharmacy how you can help
                      </label>
                      <TextArea
                        id="requirement-response"
                        required
                        minLength={5}
                        maxLength={2000}
                        rows={4}
                        value={responseMessage}
                        onChange={(event) => setResponseMessage(event.target.value)}
                        placeholder="Share relevant product availability, service coverage, or ask a useful clarification."
                      />
                      <p className="mt-2 text-xs" style={{ color: colors.muted }}>
                        Avoid sharing confidential pricing or patient information.
                      </p>
                      {responseError && (
                        <p role="alert" className="mt-3 text-sm text-red-600">
                          {responseError}
                        </p>
                      )}
                      <Button type="submit" className="mt-4" loading={submittingResponse} disabled={Boolean(myResponse)}>
                        <Send size={15} />
                        Send response
                      </Button>
                    </form>
                  ))}
              </div>
            </Card>
          </section>
        )}

        {/* Procurement next steps */}
        {canManage && (
          <Card
            style={{
              backgroundColor:
                colors.navy,
              borderColor:
                colors.navy,
            }}
          >
            <div className="p-6 sm:p-7">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Send
                      size={18}
                      style={{
                        color:
                          colors.coral,
                      }}
                    />

                    <span
                      className="text-xs font-semibold tracking-widest"
                      style={{
                        color:
                          colors.coral,
                        fontFamily:
                          '"Unica One", sans-serif',
                      }}
                    >
                      NEXT PROCUREMENT STEP
                    </span>
                  </div>

                  <h2
                    className="mt-2 text-xl font-semibold sm:text-2xl"
                    style={{
                      color:
                        "#fff",
                      fontFamily:
                        '"Cinzel", serif',
                    }}
                  >
                    Connect with the right supplier.
                  </h2>

                  <p
                    className="mt-2 text-sm leading-6"
                    style={{
                      color:
                        colors.muted,
                      fontFamily:
                        '"Fauna One", serif',
                    }}
                  >
                    Review matched profiles, connect with suitable
                    businesses, then continue the conversation toward
                    an appointment and procurement.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to="/connections">
                    <Button
                      type="button"
                      style={{
                        backgroundColor:
                          colors.pink,
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Users size={15} />
                        View connections
                      </span>
                    </Button>
                  </Link>

                  <Link to="/appointments">
                    <Button
                      type="button"
                      style={{
                        backgroundColor:
                          "#fff",
                        color:
                          colors.navy,
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays
                          size={15}
                        />
                        Appointments
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ================================================================
          MATCH DETAIL MODAL
          ================================================================ */}
      {selectedMatch &&
        isOwner &&
        canViewMatches && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedMatch(
                  null
                );
              }
            }}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-3xl border bg-white shadow-2xl"
              style={{
                borderColor:
                  colors.border,
              }}
            >
              <div
                className="h-1.5"
                style={{
                  background:
                    `linear-gradient(90deg, ${colors.pink}, ${colors.purple}, ${colors.coral})`,
                }}
              />

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold"
                      style={{
                        background:
                          `linear-gradient(135deg, ${colors.purple}, ${colors.pink})`,
                        color:
                          "#fff",
                        fontFamily:
                          '"Unica One", sans-serif',
                      }}
                    >
                      {getMatchInitials(
                        selectedMatch.name
                      )}
                    </div>

                    <div>
                      <p
                        className="text-xs"
                        style={{
                          color:
                            colors.muted,
                          fontFamily:
                            '"Unica One", sans-serif',
                        }}
                      >
                        {getMatchTypeLabel(
                          selectedMatch.targetType
                        )}
                      </p>

                      <h3
                        className="text-lg font-semibold"
                        style={{
                          color:
                            colors.navy,
                          fontFamily:
                            '"Cinzel", serif',
                        }}
                      >
                        {selectedMatch.name ||
                          "Matched profile"}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMatch(
                        null
                      )
                    }
                    className="rounded-xl p-2 transition-opacity hover:opacity-60"
                    style={{
                      color:
                        colors.muted,
                    }}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {getMatchScore(
                  selectedMatch.score
                ) !== null && (
                  <div
                    className="mt-6 rounded-2xl p-4"
                    style={{
                      backgroundColor:
                        colors.background,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color:
                            colors.navy,
                          fontFamily:
                            '"Unica One", sans-serif',
                        }}
                      >
                        MATCH SCORE
                      </span>

                      <span
                        className="text-lg font-semibold"
                        style={{
                          color:
                            colors.pink,
                          fontFamily:
                            '"Cinzel", serif',
                        }}
                      >
                        {getMatchScore(
                          selectedMatch.score
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}

                {Array.isArray(
                  selectedMatch.reasons
                ) &&
                  selectedMatch
                    .reasons.length >
                    0 && (
                    <div className="mt-5">
                      <p
                        className="text-xs font-semibold"
                        style={{
                          color:
                            colors.navy,
                          fontFamily:
                            '"Unica One", sans-serif',
                        }}
                      >
                        WHY THIS PROFILE MATCHED
                      </p>

                      <div className="mt-3 space-y-2">
                        {selectedMatch.reasons.map(
                          (
                            reason,
                            index
                          ) => (
                            <div
                              key={`${reason}-${index}`}
                              className="flex items-start gap-2"
                            >
                              <CheckCircle2
                                size={15}
                                className="mt-0.5 shrink-0"
                                style={{
                                  color:
                                    colors.coral,
                                }}
                              />

                              <p
                                className="text-sm leading-6"
                                style={{
                                  color:
                                    colors.muted,
                                  fontFamily:
                                    '"Fauna One", serif',
                                }}
                              >
                                {reason}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div
                  className="mt-6 flex flex-wrap gap-2 border-t pt-5"
                  style={{
                    borderColor:
                      colors.border,
                  }}
                >
                  {selectedMatch.userId && (
                    <ConnectButton
                      recipientUserId={
                        selectedMatch.userId
                      }
                    />
                  )}

                  {selectedMatch.userId && (
                    <Link
                      to={`/messages?user=${selectedMatch.userId}`}
                      onClick={() =>
                        setSelectedMatch(
                          null
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
                      style={{
                        borderColor:
                          colors.border,
                        color:
                          colors.navy,
                        fontFamily:
                          '"Unica One", sans-serif',
                      }}
                    >
                      <MessageCircle
                        size={15}
                      />
                      Message
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMatch(
                        null
                      )
                    }
                    className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold"
                    style={{
                      color:
                        colors.muted,
                      fontFamily:
                        '"Unica One", sans-serif',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ================================================================
          DELETE CONFIRMATION
          ================================================================ */}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDeleteOpen(false);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl"
            style={{
              borderColor:
                colors.border,
            }}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                backgroundColor:
                  `${colors.pink}12`,
                color:
                  colors.pink,
              }}
            >
              <Trash2 size={20} />
            </div>

            <h3
              className="text-xl font-semibold"
              style={{
                color:
                  colors.navy,
                fontFamily:
                  '"Cinzel", serif',
              }}
            >
              Delete requirement?
            </h3>

            <p
              className="mt-2 text-sm leading-6"
              style={{
                color:
                  colors.muted,
                fontFamily:
                  '"Fauna One", serif',
              }}
            >
              This will permanently remove this
              procurement requirement. This action
              cannot be undone.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() =>
                  setDeleteOpen(
                    false
                  )
                }
                disabled={
                  loadingDelete
                }
                style={{
                  backgroundColor:
                    "#fff",
                  color:
                    colors.navy,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </Button>

              <Button
                type="button"
                loading={
                  loadingDelete
                }
                onClick={
                  handleDelete
                }
                style={{
                  backgroundColor:
                    colors.pink,
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2
                    size={15}
                  />
                  Delete requirement
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}