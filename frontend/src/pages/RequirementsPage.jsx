
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  PackageSearch,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { apiErrorMessage, http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import RequirementSummaryCard from "../components/requirements/RequirementSummaryCard";
import {
  Card,
  ErrorState,
  EmptyState,
  Loader,
  Button,
} from "../components/ui";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#8C8496",
  background: "#FCFAF8",
  border: "#E9E2EA",
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

function EmptyRequirements({ user, activeTab }) {
  const isPharmacy = user?.role === "PHARMACY";
  const isMR = user?.role === "MR" || user?.role === "INDEPENDENT_MR";
  const isCompany =
    user?.role === "PHARMA_COMPANY" || user?.role === "COMPANY";
  const isDistributor =
    user?.role === "DISTRIBUTOR_STOCKIST" ||
    user?.role === "DISTRIBUTOR" ||
    user?.role === "STOCKIST";

  if (activeTab === "OPEN" && (isPharmacy || isDistributor)) {
    return (
      <Card className="border-[#E9E6EC] bg-white">
        <EmptyState
          title="No open requirements"
          subtitle={
            isDistributor
              ? "Post medicine or stock needs for pharmaceutical companies and distributors."
              : "Create a procurement requirement and start finding the right pharmaceutical partners."
          }
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

  if (isCompany) {
    return (
      <Card className="border-[#E9E6EC] bg-white">
        <EmptyState
          title={
            activeTab === "OPEN"
              ? "No open partner requests"
              : activeTab === "ALL"
                ? "No partner requests yet"
                : `No ${activeTab.toLowerCase()} partner requests`
          }
          subtitle="Pharmacy and distributor needs addressed to your company will appear here. For hiring, territory expansion, or distribution openings, create an opportunity."
          action={
            ["ALL", "OPEN"].includes(activeTab) ? (
              <Link to="/opportunities/create">
                <Button>
                  <Plus size={16} />
                  Create an opportunity
                </Button>
              </Link>
            ) : null
          }
        />
      </Card>
    );
  }

  if (isMR) {
    return (
      <Card className="border-[#E9E6EC] bg-white">
        <EmptyState
          title={
            activeTab === "OPEN"
              ? "No open pharmacy requests for you"
              : "No pharmacy requests for you yet"
          }
          subtitle="Current pharmacy support requests for Medical Representatives appear here. Older requests stay hidden until the pharmacy adds a therapeutic area and support type."
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
  const isPharmacy = user?.role === "PHARMACY";
  const isCompany =
    user?.role === "PHARMA_COMPANY" || user?.role === "COMPANY";

  const [items, setItems] = useState(null);
  const [activeTab, setActiveTab] = useState(
    isPharmacy ? "OPEN" : "ALL"
  );
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [loadedTab, setLoadedTab] = useState(null);

  useEffect(() => {
    let mounted = true;

    const query =
      activeTab === "ALL"
        ? "/requirements"
        : `/requirements?status=${activeTab}`;

    http
      .get(query)
      .then((response) => {
        if (!mounted) return;

        setItems(Array.isArray(response) ? response : []);
        setLoadedTab(activeTab);
      })
      .catch((requestError) => {
        if (mounted) {
          setLoadError(
            apiErrorMessage(requestError, "Unable to load requirements.")
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, reloadCount]);

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

  const isMR = user?.role === "MR" || user?.role === "INDEPENDENT_MR";
  const isDistributor =
    user?.role === "DISTRIBUTOR_STOCKIST" ||
    user?.role === "DISTRIBUTOR" ||
    user?.role === "STOCKIST";
  const canPostRequirements = isPharmacy || isDistributor;
  const visibleTabs = isPharmacy
    ? TABS
    : isCompany
      ? TABS.filter((tab) =>
          ["ALL", "OPEN", "FULFILLED", "CLOSED"].includes(tab.key)
        )
      : TABS.filter((tab) =>
          ["ALL", "OPEN", "CLOSED"].includes(tab.key)
        );

  return (
    <div className="space-y-7 pb-10">
      {/* PAGE HEADER */}
      <section
        className="relative overflow-hidden rounded-[22px] border bg-white px-5 py-6 shadow-[0_8px_28px_rgba(42,27,61,0.045)] sm:px-8 sm:py-7 lg:px-9"
        style={{
          borderColor: COLORS.border,
        }}
      >
        <div
          className="absolute right-0 top-0 h-full w-1"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <PackageSearch
                size={17}
                style={{ color: COLORS.purple }}
                strokeWidth={1.7}
              />

              <p className="font-[Philosopher] text-[10px] uppercase tracking-[0.2em]" style={{ color: COLORS.primary }}>
                {isMR
                  ? "Pharmacy requests"
                  : isCompany
                    ? "Partner requests"
                    : isDistributor
                      ? "Distribution Requirements"
                      : "Procurement workspace"}
              </p>
            </div>

            <h1 className="mt-3 font-[Cinzel] text-2xl font-semibold text-navy sm:text-3xl">
              {isMR
                ? "Pharmacy Requests for You"
                : isCompany
                  ? "Requests for Your Company"
                  : isDistributor
                    ? "Stock & Distribution Requirements"
                    : "My Requirements"}
            </h1>

            <p className="mt-3 max-w-2xl font-[Fauna_One] text-sm leading-6" style={{ color: "#6E6658" }}>
              {isMR
                ? "Review pharmacy needs addressed to Medical Representatives and respond where you can help."
                : isCompany
                  ? "Review pharmacy and distributor needs addressed to your company, respond to suitable requests, and track their status. Post hiring, territory expansion, or distribution opportunities separately."
                  : isDistributor
                    ? "Post medicine or stock needs for pharmaceutical companies and distributors. Track responses and fulfilment here."
                    : "Post medicine or stock needs for companies and distributors, or request product information or a pharmacy visit from a Medical Representative. Track responses here."}
            </p>
          </div>

          {canPostRequirements && (
            <Link to="/requirements/create" className="shrink-0">
              <Button className="w-full border-0 bg-[#D83F87] px-5 py-3 font-[Philosopher] text-xs uppercase tracking-[0.1em] text-white shadow-lg shadow-[#D83F87]/20 hover:bg-[#c93679] sm:w-auto">
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-[Philosopher] text-[10px]"
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
            {visibleTabs.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setLoadError("");
                    setActiveTab(tab.key);
                  }}
                  className="shrink-0 rounded-xl px-3.5 py-2.5 font-[Philosopher] text-[10px] uppercase tracking-[0.08em] transition-all duration-200"
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
              placeholder={
                isMR
                  ? "Search pharmacy requests..."
                  : isCompany
                    ? "Search partner requests..."
                    : "Search requirements..."
              }
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
            className="font-[Philosopher] text-[10px] uppercase tracking-[0.18em]"
            style={{ color: COLORS.primary }}
          >
            {isMR
              ? activeTab === "OPEN"
                ? "Open Pharmacy Requests"
                : activeTab === "ALL"
                  ? "All Pharmacy Requests"
                  : `${activeTab} Pharmacy Requests`
              : isCompany
                ? activeTab === "ALL"
                  ? "All Partner Requests"
                  : `${activeTab} Partner Requests`
                : activeTab === "OPEN"
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
              : isMR
                ? activeTab === "OPEN"
                  ? "Open Pharmacy Requests"
                  : "Pharmacy Requests"
                : isCompany
                  ? activeTab === "OPEN"
                    ? "Open Partner Requests"
                    : "Partner Requests"
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
              {isMR || isCompany
                ? filteredItems.length === 1
                  ? "request"
                  : "requests"
                : filteredItems.length === 1
                  ? "requirement"
                  : "requirements"}
              {search ? " found" : ""}
            </p>
          )}
        </div>

        {isPharmacy && (
          <Link
            to="/requirements/create"
            className="hidden items-center gap-1 font-[Philosopher] text-[10px] uppercase tracking-[0.1em] sm:flex"
            style={{ color: COLORS.primary }}
          >
            Create requirement
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* RESULTS */}
      {loadError ? (
        <ErrorState
          message={loadError}
          onRetry={() => {
            setLoadError("");
            setReloadCount((count) => count + 1);
          }}
        />
      ) : !items || loadedTab !== activeTab ? (
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
            <RequirementSummaryCard
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D83F87] px-5 py-3 font-[Philosopher] text-xs uppercase tracking-[0.08em] text-white transition hover:bg-[#c93679] sm:w-auto"
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
