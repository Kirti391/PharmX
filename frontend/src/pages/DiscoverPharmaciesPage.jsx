
import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  RefreshCw,
  Store,
  Users,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import {
  Card,
  EmptyState,
  Input,
  Loader,
} from "../components/ui";
import { DiscoverTabs, ConnectButton } from "../components/discovery";
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
  const value = String(name || "PH").trim();

  if (!value) return "PH";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];

  return categories.filter(Boolean);
}

export default function DiscoverPharmaciesPage() {
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState(null);
  const [territory, setTerritory] = useState("");
  const [category, setCategory] = useState("");
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

    if (category.trim()) {
      params.set("category", category.trim());
    }

    try {
      const result = await http.get(
        `/discover/pharmacies?${params.toString()}`
      );

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setItems([]);

      setError(
        apiErrorMessage(
          err,
          "Unable to load pharmacies right now."
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
    setCategory("");

    setTimeout(() => {
      load();
    }, 0);
  }

  /*
   * Defense-in-depth:
   * the backend should exclude the authenticated user's own
   * pharmacy profile, but the frontend also removes it before
   * rendering.
   */
  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    if (!user?.id) return items;

    return items.filter((pharmacy) => {
      if (!pharmacy?.userId) return false;

      return String(pharmacy.userId) !== String(user.id);
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
                backgroundColor: `${COLORS.purple}12`,
                color: COLORS.purple,
              }}
            >
              <Users size={20} />
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
            Explore verified healthcare partners and build
            professional relationships across the PharmUnis network.
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

      {/* Context */}
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
              backgroundColor: `${COLORS.primary}12`,
              color: COLORS.primary,
            }}
          >
            <Store size={17} />
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.navy }}
            >
              Pharmacy network
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "#6E6658" }}
            >
              Connect with other pharmacies when you need to
              coordinate professional relationships, local
              availability, or healthcare-network activity.
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
            Find pharmacies
          </p>

          <p
            className="mt-0.5 text-xs"
            style={{ color: COLORS.muted }}
          >
            Narrow results by territory or category.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-xs">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Location
            </label>

            <Input
              placeholder="e.g. Delhi, Haryana…"
              value={territory}
              onChange={(event) => setTerritory(event.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full lg:max-w-xs">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Interested category
            </label>

            <Input
              placeholder="e.g. Tablets, OTC…"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full"
            />
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

            {(territory || category) && (
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
            title="No other pharmacies found"
            subtitle={
              territory || category
                ? "Try broadening or clearing your filters."
                : "No other pharmacies are currently available in the discovery network."
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: COLORS.navy }}
              >
                Pharmacy network
              </p>

              <p
                className="mt-0.5 text-xs"
                style={{ color: COLORS.muted }}
              >
                {visibleItems.length}{" "}
                {visibleItems.length === 1
                  ? "pharmacy"
                  : "pharmacies"}{" "}
                found
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleItems.map((pharmacy) => {
              const categories = normalizeCategories(
                pharmacy.interestedCategories
              );

              const name =
                pharmacy.pharmacyName ||
                pharmacy.name ||
                "Pharmacy";

              const isSelf =
                user?.id &&
                pharmacy?.userId &&
                String(pharmacy.userId) === String(user.id);

              return (
                <Card key={pharmacy.id}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
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
                              className="font-display font-semibold"
                              style={{ color: COLORS.navy }}
                            >
                              {name}
                            </h3>

                            {pharmacy.businessVerified && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  backgroundColor: `${COLORS.primary}12`,
                                  color: COLORS.primary,
                                }}
                              >
                                Verified
                              </span>
                            )}
                          </div>

                          {pharmacy.location && (
                            <p
                              className="mt-1 flex items-center gap-1 text-xs"
                              style={{ color: COLORS.muted }}
                            >
                              <MapPin size={12} />
                              {pharmacy.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Never allow a self-connection */}
                      {!isSelf && pharmacy.userId && (
                        <ConnectButton
                          recipientUserId={pharmacy.userId}
                        />
                      )}
                    </div>

                    {categories.length > 0 && (
                      <div>
                        <p
                          className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: COLORS.muted }}
                        >
                          Interested categories
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {categories.map((cat) => (
                            <span
                              key={cat}
                              className="rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${COLORS.purple}10`,
                                color: COLORS.purple,
                              }}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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

