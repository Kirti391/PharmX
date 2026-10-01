
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  PackageSearch,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import {
  Card,
  EmptyState,
  Loader,
  StatusBadge,
  Button,
} from "../components/ui";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#A4B3B6",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

const TABS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "MATCHING", label: "Matching" },
  { key: "RESPONSES", label: "Responses" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "CONNECTED", label: "Connected" },
  { key: "FULFILLED", label: "Fulfilled" },
  { key: "CLOSED", label: "Closed" },
];

const URGENCY_STYLES = {
  HIGH: {
    color: COLORS.primary,
    background: "#FCE8F1",
    label: "High urgency",
  },
  NORMAL: {
    color: COLORS.purple,
    background: "#F1ECFA",
    label: "Normal urgency",
  },
  LOW: {
    color: COLORS.muted,
    background: "#F2F1F3",
    label: "Low urgency",
  },
};

function formatCreatedAt(value) {
  if (!value) return "Recently created";

  try {
    return formatDistanceToNow(new Date(value), {
      addSuffix: true,
    });
  } catch {
    return "Recently created";
  }
}

function normalizeStatus(status) {
  return String(status || "OPEN").toUpperCase();
}

function getResponseCount(requirement) {
  return (
    requirement.responseCount ??
    requirement.responsesCount ??
    (Array.isArray(requirement.responses)
      ? requirement.responses.length
      : null)
  );
}

function getRequirementLocation(requirement) {
  if (typeof requirement.location === "string") {
    return requirement.location;
  }

  if (requirement.location?.city) {
    return [
      requirement.location.city,
      requirement.location.state,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return requirement.city || requirement.serviceArea || null;
}

function getRequirementProducts(requirement) {
  if (Array.isArray(requirement.products)) {
    return requirement.products;
  }

  if (Array.isArray(requirement.molecules)) {
    return requirement.molecules;
  }

  return [];
}

function RequirementCard({ requirement }) {
  const urgency =
    URGENCY_STYLES[normalizeStatus(requirement.urgency)] ||
    URGENCY_STYLES.NORMAL;

  const responseCount = getResponseCount(requirement);
  const location = getRequirementLocation(requirement);
  const products = getRequirementProducts(requirement);

  return (
    <Link
      to={`/requirements/${requirement.id || requirement._id}`}
      className="group block h-full"
    >
      <Card className="relative h-full overflow-hidden border-[#E9E6EC] bg-white p-0 transition-all duration-300 hover:-translate-y-1 hover:border-[#D83F87]/30 hover:shadow-xl">
        <div
          className="absolute left-0 top-0 h-1 w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <span
              className="rounded-full px-2.5 py-1 font-[Unica_One] text-[9px] uppercase tracking-[0.12em]"
              style={{
                backgroundColor: "#F1ECFA",
                color: COLORS.purple,
              }}
            >
              {requirement.category || "General"}
            </span>

            <span
              className="rounded-full px-2.5 py-1 font-[Unica_One] text-[9px] uppercase tracking-[0.1em]"
              style={{
                backgroundColor: urgency.background,
                color: urgency.color,
              }}
            >
              {urgency.label}
            </span>
          </div>

          <h3
            className="mt-4 font-[Cinzel] text-base font-semibold leading-6 transition-colors group-hover:text-[#D83F87]"
            style={{ color: COLORS.navy }}
          >
            {requirement.title || "Untitled Requirement"}
          </h3>

          <p
            className="mt-2 line-clamp-2 min-h-[42px] font-[Fauna_One] text-xs leading-5"
            style={{ color: COLORS.muted }}
          >
            {requirement.description ||
              requirement.additionalInfo ||
              "No additional details provided."}
          </p>

          {products.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {products.slice(0, 3).map((product, index) => {
                const label =
                  typeof product === "string"
                    ? product
                    : product?.name ||
                      product?.molecule ||
                      product?.productName;

                if (!label) return null;

                return (
                  <span
                    key={`${label}-${index}`}
                    className="rounded-lg border px-2 py-1 font-[Fauna_One] text-[10px]"
                    style={{
                      borderColor: COLORS.border,
                      color: COLORS.navy,
                    }}
                  >
                    {label}
                  </span>
                );
              })}

              {products.length > 3 && (
                <span
                  className="rounded-lg px-2 py-1 font-[Fauna_One] text-[10px]"
                  style={{
                    backgroundColor: "#F8F7F9",
                    color: COLORS.muted,
                  }}
                >
                  +{products.length - 3} more
                </span>
              )}
            </div>
          )}

          <div
            className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2"
            style={{ borderColor: COLORS.border }}
          >
            {location && (
              <div className="flex min-w-0 items-center gap-2">
                <MapPin
                  size={14}
                  className="shrink-0"
                  style={{ color: COLORS.primary }}
                />
                <span
                  className="truncate font-[Fauna_One] text-[10px]"
                  style={{ color: COLORS.muted }}
                >
                  {location}
                </span>
              </div>
            )}

            {responseCount !== null && responseCount !== undefined && (
              <div className="flex items-center gap-2">
                <Users
                  size={14}
                  className="shrink-0"
                  style={{ color: COLORS.purple }}
                />
                <span
                  className="font-[Fauna_One] text-[10px]"
                  style={{ color: COLORS.muted }}
                >
                  {responseCount}{" "}
                  {responseCount === 1 ? "response" : "responses"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span
              className="flex items-center gap-1.5 font-[Fauna_One] text-[10px]"
              style={{ color: COLORS.muted }}
            >
              <Clock3 size={12} />
              {formatCreatedAt(requirement.createdAt)}
            </span>

            <div
              className="flex items-center gap-1 font-[Unica_One] text-[10px] uppercase tracking-[0.1em] transition-all group-hover:gap-2"
              style={{ color: COLORS.primary }}
            >
              View
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyRequirements({ user, activeTab }) {
  const isPharmacy = user?.role === "PHARMACY";

  if (activeTab === "OPEN" && isPharmacy) {
    return (
      <Card className="border-[#E9E6EC] bg-white">
        <EmptyState
          title="No open requirements"
          subtitle="Create a procurement requirement and start finding the right pharmaceutical partners."
          action={
            <Link to="/requirements/create">
              <Button>
                <Plus size={16} />
                Create Requirement
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="border-[#E9E6EC] bg-white">
      <EmptyState
        title={`No ${activeTab.toLowerCase()} requirements`}
        subtitle="Requirements matching this stage will appear here."
      />
    </Card>
  );
}

export default function RequirementsPage() {
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState(null);
  const [activeTab, setActiveTab] = useState(
    user?.role === "PHARMACY" ? "OPEN" : "ALL"
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    setItems(null);

    const query =
      activeTab === "ALL"
        ? "/requirements"
        : `/requirements?status=${activeTab}`;

    http
      .get(query)
      .then((response) => {
        if (!mounted) return;

        setItems(Array.isArray(response) ? response : []);
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    const value = search.trim().toLowerCase();

    if (!value) return items;

    return items.filter((requirement) => {
      const products = getRequirementProducts(requirement)
        .map((product) =>
          typeof product === "string"
            ? product
            : product?.name ||
              product?.molecule ||
              product?.productName ||
              ""
        )
        .join(" ");

      const searchable = [
        requirement.title,
        requirement.description,
        requirement.additionalInfo,
        requirement.category,
        requirement.location,
        requirement.city,
        products,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(value);
    });
  }, [items, search]);

  const isPharmacy = user?.role === "PHARMACY";

  return (
    <div className="space-y-7 pb-10">
      {/* PAGE HEADER */}
      <section
        className="relative overflow-hidden rounded-[26px] px-6 py-7 sm:px-8 lg:px-10 lg:py-8"
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.purple} 100%)`,
        }}
      >
        <div
          className="absolute -right-20 -top-24 h-60 w-60 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div
          className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: COLORS.coral }}
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <PackageSearch
                size={17}
                className="text-white/60"
                strokeWidth={1.7}
              />

              <p className="font-[Unica_One] text-[10px] uppercase tracking-[0.2em] text-white/55">
                Procurement Workspace
              </p>
            </div>

            <h1 className="mt-3 font-[Cinzel] text-2xl font-semibold text-white sm:text-3xl">
              My Requirements
            </h1>

            <p className="mt-3 max-w-2xl font-[Fauna_One] text-sm leading-6 text-white/65">
              Define what your pharmacy needs, track supplier responses and
              move the right opportunities toward a business connection.
            </p>
          </div>

          {isPharmacy && (
            <Link to="/requirements/create" className="shrink-0">
              <Button className="w-full border-0 bg-[#D83F87] px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.1em] text-white shadow-lg shadow-[#D83F87]/20 hover:bg-[#c93679] sm:w-auto">
                <Plus size={17} />
                New Requirement
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* PROCUREMENT FLOW */}
      {isPharmacy && (
        <section className="grid gap-3 md:grid-cols-4">
          {[
            {
              number: "01",
              title: "Requirement",
              text: "Tell us what you need.",
              icon: FileText,
            },
            {
              number: "02",
              title: "Matching",
              text: "Relevant partners are discovered.",
              icon: Search,
            },
            {
              number: "03",
              title: "Responses",
              text: "Review supplier responses.",
              icon: MessageSquareIcon,
            },
            {
              number: "04",
              title: "Connection",
              text: "Connect and discuss procurement.",
              icon: CheckCircle2,
            },
          ].map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="group rounded-2xl border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: COLORS.border }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-[Unica_One] text-[10px]"
                    style={{
                      backgroundColor: "#FCE8F1",
                      color: COLORS.primary,
                    }}
                  >
                    {step.number}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={14}
                        style={{ color: COLORS.purple }}
                      />

                      <p
                        className="font-[Cinzel] text-xs font-semibold"
                        style={{ color: COLORS.navy }}
                      >
                        {step.title}
                      </p>
                    </div>

                    <p
                      className="mt-1 font-[Fauna_One] text-[10px] leading-4"
                      style={{ color: COLORS.muted }}
                    >
                      {step.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* TOOLBAR */}
      <section
        className="rounded-2xl border bg-white p-4 sm:p-5"
        style={{ borderColor: COLORS.border }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="shrink-0 rounded-xl px-3.5 py-2.5 font-[Unica_One] text-[10px] uppercase tracking-[0.08em] transition-all duration-200"
                  style={{
                    backgroundColor: active
                      ? COLORS.primary
                      : "#F8F7F9",
                    color: active ? "#FFFFFF" : COLORS.muted,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full xl:max-w-xs">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: COLORS.muted }}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requirements..."
              className="h-11 w-full rounded-xl border bg-[#F8F7F9] pl-10 pr-4 font-[Fauna_One] text-xs outline-none transition focus:border-[#D83F87] focus:ring-2 focus:ring-[#D83F87]/10"
              style={{
                borderColor: COLORS.border,
                color: COLORS.navy,
              }}
            />
          </div>
        </div>
      </section>

      {/* RESULTS HEADER */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em]"
            style={{ color: COLORS.primary }}
          >
            {activeTab === "OPEN"
              ? "Open Procurement"
              : activeTab === "ALL"
                ? "All Requirements"
                : activeTab}
          </p>

          <h2
            className="mt-1 font-[Cinzel] text-xl font-semibold"
            style={{ color: COLORS.navy }}
          >
            {search
              ? "Search Results"
              : activeTab === "OPEN"
                ? "Open Requirements"
                : "Requirements"}
          </h2>

          {Array.isArray(items) && (
            <p
              className="mt-1 font-[Fauna_One] text-xs"
              style={{ color: COLORS.muted }}
            >
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "requirement" : "requirements"}
              {search ? " found" : ""}
            </p>
          )}
        </div>

        {isPharmacy && (
          <Link
            to="/requirements/create"
            className="hidden items-center gap-1 font-[Unica_One] text-[10px] uppercase tracking-[0.1em] sm:flex"
            style={{ color: COLORS.primary }}
          >
            Create requirement
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* RESULTS */}
      {!items ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border bg-white">
          <Loader />
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyRequirements
          user={user}
          activeTab={activeTab}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((requirement) => (
            <RequirementCard
              key={requirement.id || requirement._id}
              requirement={requirement}
            />
          ))}
        </div>
      )}

      {/* BOTTOM CTA */}
      {isPharmacy && (
        <section
          className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
          style={{
            background: `linear-gradient(120deg, ${COLORS.purple}, ${COLORS.navy})`,
          }}
        >
          <div
            className="absolute -right-16 -top-20 h-48 w-48 rounded-full opacity-20 blur-3xl"
            style={{ backgroundColor: COLORS.primary }}
          />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white sm:flex">
                <Sparkles size={19} />
              </div>

              <div>
                <h3 className="font-[Cinzel] text-base font-semibold text-white">
                  Need something from the market?
                </h3>

                <p className="mt-1 max-w-xl font-[Fauna_One] text-xs leading-5 text-white/55">
                  Create a requirement once and use the PharmUnis network to
                  discover relevant pharmaceutical partners.
                </p>
              </div>
            </div>

            <Link to="/requirements/create" className="shrink-0">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D83F87] px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.08em] text-white transition hover:bg-[#c93679] sm:w-auto"
              >
                <Plus size={16} />
                Post Requirement
              </button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function MessageSquareIcon(props) {
  return <PackageSearch {...props} />;
}

