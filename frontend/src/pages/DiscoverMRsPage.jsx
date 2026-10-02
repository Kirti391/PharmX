
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  RefreshCw,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import {
  Card,
  EmptyState,
  Input,
  Loader,
  Select,
  StatusBadge,
} from "../components/ui";
import {
  DiscoverTabs,
  ConnectButton,
} from "../components/discovery";
import { useAuthStore } from "../store/authStore";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#A4B3B6",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

function getInitials(name) {
  const value = String(name || "MR").trim();

  if (!value) return "MR";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getWorkModeLabel(workMode) {
  const labels = {
    FIELD: "Field",
    HYBRID: "Hybrid",
    REMOTE: "Remote",
  };

  return (
    labels[String(workMode || "").toUpperCase()] ||
    "Not specified"
  );
}

function getAvailabilityStatus(status) {
  return String(status || "").toUpperCase() === "AVAILABLE"
    ? "ACTIVE"
    : "PENDING";
}

export default function DiscoverMRsPage() {
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState(null);

  const [territory, setTerritory] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [workMode, setWorkMode] = useState("");

  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setItems(null);
    }

    setError("");

    const params = new URLSearchParams();

    if (territory.trim()) {
      params.set("territory", territory.trim());
    }

    if (specialization.trim()) {
      params.set("specialization", specialization.trim());
    }

    if (workMode) {
      params.set("workMode", workMode);
    }

    try {
      const result = await http.get(
        `/discover/mrs?${params.toString()}`
      );

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setItems([]);

      setError(
        apiErrorMessage(
          err,
          "Unable to load medical representatives right now."
        )
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function clearFilters() {
    setTerritory("");
    setSpecialization("");
    setWorkMode("");

    setTimeout(() => {
      load();
    }, 0);
  }

  /*
   * Defense-in-depth:
   * the backend should exclude the authenticated user's own
   * MR profile, but the frontend also removes it.
   */
  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    if (!user?.id) return items;

    return items.filter((mr) => {
      if (!mr?.userId) return false;

      return String(mr.userId) !== String(user.id);
    });
  }, [items, user?.id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${COLORS.primary}12`,
                color: COLORS.primary,
              }}
            >
              <UserRound size={20} />
            </div>

            <h1
              className="font-display text-2xl font-bold"
              style={{ color: COLORS.navy }}
            >
              Discover
            </h1>
          </div>

          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{ color: "#6E6658" }}
          >
            Find medical representatives by territory,
            specialization, availability, and preferred work mode.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border bg-white px-3.5 py-2 text-sm font-medium transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: COLORS.border,
            color: COLORS.navy,
          }}
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Discovery navigation */}
      <DiscoverTabs />

      {/* Procurement context */}
      <div
        className="rounded-2xl border p-4 sm:p-5"
        style={{
          borderColor: COLORS.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${COLORS.purple}12`,
              color: COLORS.purple,
            }}
          >
            <BriefcaseBusiness size={17} />
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.navy }}
            >
              Connect with Medical Representatives
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "#6E6658" }}
            >
              Find representatives who work in your territory and
              understand the product categories relevant to your
              pharmacy requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: COLORS.border,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div className="mb-3">
          <p
            className="text-sm font-semibold"
            style={{ color: COLORS.navy }}
          >
            Find medical representatives
          </p>

          <p
            className="mt-0.5 text-xs"
            style={{ color: COLORS.muted }}
          >
            Narrow the network to representatives relevant to your
            territory and procurement needs.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="w-full xl:max-w-xs">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Territory
            </label>

            <Input
              placeholder="e.g. Haryana, Delhi…"
              value={territory}
              onChange={(e) => setTerritory(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full xl:max-w-xs">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Specialization
            </label>

            <Input
              placeholder="e.g. Cardiology, OTC…"
              value={specialization}
              onChange={(e) =>
                setSpecialization(e.target.value)
              }
              className="w-full"
            />
          </div>

          <div className="w-full xl:max-w-[180px]">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Work mode
            </label>

            <Select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
              className="w-full"
            >
              <option value="">Any work mode</option>
              <option value="FIELD">Field</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => load()}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: COLORS.primary }}
            >
              Apply filters
            </button>

            {(territory || specialization || workMode) && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-gray-50"
                style={{
                  borderColor: COLORS.border,
                  color: COLORS.navy,
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: `${COLORS.coral}55`,
            backgroundColor: `${COLORS.coral}10`,
            color: "#7A3F38",
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {!items ? (
        <Loader />
      ) : visibleItems.length === 0 ? (
        <Card>
          <EmptyState
            title="No other medical representatives found"
            subtitle={
              territory || specialization || workMode
                ? "Try broadening or clearing your filters."
                : "No other medical representatives are currently available in the discovery network."
            }
          />
        </Card>
      ) : (
        <>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.navy }}
            >
              Medical Representatives
            </p>

            <p
              className="mt-0.5 text-xs"
              style={{ color: COLORS.muted }}
            >
              {visibleItems.length}{" "}
              {visibleItems.length === 1
                ? "representative"
                : "representatives"}{" "}
              found
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleItems.map((mr) => {
              const specializations = normalizeArray(
                mr.specializations
              );

              const territories = normalizeArray(
                mr.territories
              );

              const name =
                mr.fullName ||
                mr.name ||
                "Medical Representative";

              const availabilityStatus = String(
                mr.availabilityStatus || ""
              ).toUpperCase();

              const isSelf =
                user?.id &&
                mr?.userId &&
                String(mr.userId) === String(user.id);

              return (
                <Card key={mr.id}>
                  <div className="flex flex-col gap-5">
                    {/* Profile header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                          style={{
                            backgroundColor: `${COLORS.purple}12`,
                            color: COLORS.purple,
                          }}
                        >
                          {getInitials(name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className="font-display text-base font-semibold"
                              style={{ color: COLORS.navy }}
                            >
                              {name}
                            </h3>

                            {mr.isIndependent && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  backgroundColor: `${COLORS.purple}12`,
                                  color: COLORS.purple,
                                }}
                              >
                                Independent
                              </span>
                            )}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            {mr.experienceYears !== undefined &&
                              mr.experienceYears !== null && (
                                <span
                                  style={{
                                    color: "#6E6658",
                                  }}
                                >
                                  {mr.experienceYears}{" "}
                                  {mr.experienceYears === 1
                                    ? "year"
                                    : "years"}{" "}
                                  experience
                                </span>
                              )}

                            {mr.workMode && (
                              <>
                                <span
                                  style={{
                                    color: COLORS.border,
                                  }}
                                >
                                  ·
                                </span>

                                <span
                                  style={{
                                    color: COLORS.muted,
                                  }}
                                >
                                  {getWorkModeLabel(
                                    mr.workMode
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Never allow a self-connection */}
                      {!isSelf && mr.userId && (
                        <ConnectButton
                          recipientUserId={mr.userId}
                        />
                      )}
                    </div>

                    {/* Availability */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor:
                              availabilityStatus === "AVAILABLE"
                                ? `${COLORS.primary}12`
                                : `${COLORS.muted}18`,
                            color:
                              availabilityStatus === "AVAILABLE"
                                ? COLORS.primary
                                : COLORS.navy,
                          }}
                        >
                          <CheckCircle2 size={15} />
                        </span>

                        <div>
                          <p
                            className="text-xs font-semibold"
                            style={{ color: COLORS.navy }}
                          >
                            Availability
                          </p>

                          <div className="mt-1">
                            <StatusBadge
                              status={getAvailabilityStatus(
                                mr.availabilityStatus
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {mr.bio && (
                      <p
                        className="text-sm leading-6"
                        style={{ color: "#4F4A41" }}
                      >
                        {mr.bio}
                      </p>
                    )}

                    {/* Specializations */}
                    {specializations.length > 0 && (
                      <div>
                        <p
                          className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: COLORS.muted }}
                        >
                          Specializations
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {specializations.map(
                            (specializationItem) => (
                              <span
                                key={specializationItem}
                                className="rounded-full px-2.5 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor: `${COLORS.primary}10`,
                                  color: COLORS.primary,
                                }}
                              >
                                {specializationItem}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Territories */}
                    {territories.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5">
                          <MapPin
                            size={13}
                            style={{
                              color: COLORS.purple,
                            }}
                          />

                          <p
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: COLORS.muted }}
                          >
                            Territories
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {territories.map((territoryItem) => (
                            <span
                              key={territoryItem}
                              className="rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${COLORS.purple}10`,
                                color: COLORS.purple,
                              }}
                            >
                              {territoryItem}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className="flex items-center gap-2 border-t pt-3 text-xs"
                      style={{
                        borderColor: COLORS.border,
                      }}
                    >
                      <UserRound
                        size={13}
                        style={{ color: COLORS.muted }}
                      />

                      <span style={{ color: COLORS.muted }}>
                        Connect to start a professional relationship
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

