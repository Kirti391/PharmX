import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Truck,
} from "lucide-react";

import { http, apiErrorMessage } from "../lib/api";
import {
  Card,
  EmptyState,
  Input,
  Loader,
  Select,
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
  muted: "#8C8496",
  background: "#FCFAF8",
  border: "#E9E2EA",
};

function getInitials(name) {
  const value = String(name || "DS").trim();

  if (!value) return "DS";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getTypeLabel(type) {
  const normalized = String(type || "").toUpperCase();

  if (normalized === "STOCKIST") return "Stockist";
  if (normalized === "DISTRIBUTOR") return "Distributor";
  if (normalized === "C_AND_F_AGENT") return "C&F agent";

  return "Distributor / Stockist";
}

export default function DiscoverStockistsPage() {
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState(null);
  const [territory, setTerritory] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

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

    if (type) {
      params.set("type", type);
    }

    try {
      const result = await http.get(
        `/discover/stockists?${params.toString()}`
      );

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setItems([]);

      setError(
        apiErrorMessage(
          err,
          "Unable to load distributors and stockists right now."
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
    setType("");

    setTimeout(() => {
      load();
    }, 0);
  }

  /*
   * Frontend safety:
   * Never show the authenticated user's own profile,
   * even if the backend accidentally returns it.
   *
   * Backend discovery endpoints should ALSO exclude the
   * authenticated user's own profile.
   */
  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    if (!user?.id) return items;

    return items.filter((item) => {
      const profileUserId = item?.userId;

      return (
        profileUserId &&
        String(profileUserId) !== String(user.id)
      );
    });
  }, [items, user?.id]);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${COLORS.primary}12`,
                color: COLORS.primary,
              }}
            >
              <Truck size={20} />
            </div>

            <h1
              className="font-display text-2xl font-semibold sm:text-3xl"
              style={{ color: COLORS.navy }}
            >
              Discover
            </h1>
          </div>

          <p
            className="mt-2 max-w-2xl text-xs leading-6"
            style={{ color: "#6E6658" }}
          >
            Find distributors and stockists by service area,
            product category, and business type.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border bg-white px-4 py-2.5 text-xs font-medium transition hover:border-[#D83F87]/30 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
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
        className="rounded-[20px] border p-5 shadow-[0_6px_22px_rgba(42,27,61,0.03)] sm:p-6"
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
            <Building2 size={17} />
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.navy }}
            >
              Find distributors and stockists
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "#6E6658" }}
            >
              Explore supply partners serving your area and
              carrying the categories you need for pharmacy
              procurement.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-[20px] border p-5 shadow-[0_6px_22px_rgba(42,27,61,0.03)] sm:p-6"
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
            Find supply partners
          </p>

          <p
            className="mt-0.5 text-xs"
            style={{ color: COLORS.muted }}
          >
            Filter the distributor and stockist network to match
            your procurement needs.
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="w-full xl:max-w-xs">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Service area
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
              Product category
            </label>

            <Input
              placeholder="e.g. Antibiotics, OTC…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="w-full xl:max-w-[200px]">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Business type
            </label>

            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full"
            >
              <option value="">Distributors & Stockists</option>
              <option value="STOCKIST">Stockists only</option>
              <option value="DISTRIBUTOR">
                Distributors only
              </option>
              <option value="C_AND_F_AGENT">
                C&amp;F agents only
              </option>
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

            {(territory || category || type) && (
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
            title="No distributors or stockists found"
            subtitle={
              territory || category || type
                ? "Try broadening or clearing your filters."
                : "No other distributors or stockists are currently available in the discovery network."
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
              Distributors & Stockists
            </p>

            <p
              className="mt-0.5 text-xs"
              style={{ color: COLORS.muted }}
            >
              {visibleItems.length}{" "}
              {visibleItems.length === 1
                ? "supply partner"
                : "supply partners"}{" "}
              found
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleItems.map((stockist) => {
              const categories = normalizeArray(
                stockist.productCategories
              );

              const serviceAreas = normalizeArray(
                stockist.serviceAreas
              );

              const name =
                stockist.companyName ||
                stockist.businessName ||
                "Distributor / Stockist";

              const isSelf =
                user?.id &&
                stockist?.userId &&
                String(stockist.userId) === String(user.id);

              return (
                <Card key={stockist.id}>
                  <div className="flex flex-col gap-5">
                    {/* Header */}
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

                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                              style={{
                                backgroundColor: `${COLORS.purple}10`,
                                color: COLORS.purple,
                              }}
                            >
                              {getTypeLabel(stockist.type)}
                            </span>

                            {stockist.businessVerified && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  backgroundColor: `${COLORS.primary}10`,
                                  color: COLORS.primary,
                                }}
                              >
                                <CheckCircle2 size={11} />
                                Verified
                              </span>
                            )}
                          </div>

                          <p
                            className="mt-1.5 text-xs"
                            style={{ color: COLORS.muted }}
                          >
                            {getTypeLabel(stockist.type)}
                          </p>
                        </div>
                      </div>

                      {/* Never show Connect for self */}
                      {!isSelf && stockist.userId && (
                        <ConnectButton
                          recipientUserId={stockist.userId}
                        />
                      )}
                    </div>

                    {/* Service areas */}
                    {serviceAreas.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5">
                          <MapPin
                            size={13}
                            style={{ color: COLORS.purple }}
                          />

                          <p
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: COLORS.muted }}
                          >
                            Service areas
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {serviceAreas.map((area) => (
                            <span
                              key={area}
                              className="rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${COLORS.purple}10`,
                                color: COLORS.purple,
                              }}
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Product categories */}
                    {categories.length > 0 && (
                      <div>
                        <p
                          className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: COLORS.muted }}
                        >
                          Product categories
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {categories.map((categoryItem) => (
                            <span
                              key={categoryItem}
                              className="rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${COLORS.primary}10`,
                                color: COLORS.primary,
                              }}
                            >
                              {categoryItem}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div
                      className="flex items-center gap-2 border-t pt-3 text-xs"
                      style={{ borderColor: COLORS.border }}
                    >
                      <Truck
                        size={13}
                        style={{ color: COLORS.muted }}
                      />

                      <span style={{ color: COLORS.muted }}>
                        Connect to discuss supply and procurement
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