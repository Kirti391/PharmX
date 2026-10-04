import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  MapPin,
  Package,
  RefreshCw,
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
  muted: "#8C8496",
  background: "#FCFAF8",
  border: "#E9E2EA",
};

function getInitials(name) {
  const value = String(name || "Company").trim();

  if (!value) return "PC";

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default function DiscoverCompaniesPage() {
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
        `/discover/companies?${params.toString()}`
      );

      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setItems([]);

      setError(
        apiErrorMessage(
          err,
          "Unable to load pharma companies right now."
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
   * Never show the authenticated user's own company profile.
   *
   * This is a frontend safety layer. The backend discovery
   * endpoint should also exclude the authenticated user's
   * profile.
   */
  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    if (!user?.id) return items;

    return items.filter((company) => {
      if (!company?.userId) return false;

      return String(company.userId) !== String(user.id);
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
              <Building2 size={20} />
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
            Find pharma companies that match your procurement
            needs, product categories, and operating territory.
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
            <Package size={17} />
          </div>

          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: COLORS.navy }}
            >
              Find your next supplier
            </p>

            <p
              className="mt-1 text-sm leading-6"
              style={{ color: "#6E6658" }}
            >
              Explore companies by product category and territory.
              When you find a relevant supplier, connect with them
              and continue the procurement conversation through
              PharmUnis.
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
            Search pharma companies
          </p>

          <p
            className="mt-0.5 text-xs"
            style={{ color: COLORS.muted }}
          >
            Filter suppliers by territory or the categories they
            manufacture.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full lg:max-w-xs">
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

          <div className="w-full lg:max-w-xs">
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{ color: COLORS.navy }}
            >
              Product category
            </label>

            <Input
              placeholder="e.g. Tablets, Injections…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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
            title="No pharma companies found"
            subtitle={
              territory || category
                ? "Try broadening or clearing your filters."
                : "No other pharma companies are currently available in the discovery network."
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
              Pharma Companies
            </p>

            <p
              className="mt-0.5 text-xs"
              style={{ color: COLORS.muted }}
            >
              {visibleItems.length}{" "}
              {visibleItems.length === 1
                ? "company"
                : "companies"}{" "}
              found
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleItems.map((company) => {
              const categories = normalizeArray(
                company.productCategories
              );

              const name =
                company.companyName ||
                company.name ||
                "Pharma Company";

              const isSelf =
                user?.id &&
                company?.userId &&
                String(company.userId) === String(user.id);

              return (
                <Card key={company.id}>
                  <div className="flex flex-col gap-5">
                    {/* Company header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                          style={{
                            backgroundColor: `${COLORS.primary}12`,
                            color: COLORS.primary,
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

                            {company.businessVerified && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                                style={{
                                  backgroundColor: `${COLORS.primary}12`,
                                  color: COLORS.primary,
                                }}
                              >
                                <CheckCircle2 size={11} />
                                Verified
                              </span>
                            )}
                          </div>

                          {company.manufacturingLocation && (
                            <p
                              className="mt-1.5 flex items-center gap-1.5 text-xs"
                              style={{ color: COLORS.muted }}
                            >
                              <MapPin size={12} />
                              {company.manufacturingLocation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Never allow a self-connection */}
                      {!isSelf && company.userId && (
                        <ConnectButton
                          recipientUserId={company.userId}
                        />
                      )}
                    </div>

                    {/* Description */}
                    {company.description && (
                      <p
                        className="text-sm leading-6"
                        style={{ color: "#4F4A41" }}
                      >
                        {company.description}
                      </p>
                    )}

                    {/* Categories */}
                    {categories.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-1.5">
                          <Package
                            size={13}
                            style={{ color: COLORS.purple }}
                          />

                          <p
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: COLORS.muted }}
                          >
                            Product categories
                          </p>
                        </div>

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

                    {/* Procurement CTA hint */}
                    <div
                      className="flex items-center gap-2 border-t pt-3 text-xs"
                      style={{ borderColor: COLORS.border }}
                    >
                      <Building2
                        size={13}
                        style={{ color: COLORS.muted }}
                      />

                      <span style={{ color: COLORS.muted }}>
                        Connect to start a supplier relationship
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