import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  BriefcaseBusiness,
  ChevronRight,
  ClipboardList,
  MapPin,
  Package,
  Store,
  UserRound,
} from "lucide-react";

import { http } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import {
  Card,
  EmptyState,
  Loader,
  StatusBadge,
  Button,
} from "../components/ui";


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeRole(role) {
  const value = String(role || "").trim().toUpperCase();

  if (value === "DISTRIBUTOR" || value === "STOCKIST") {
    return "DISTRIBUTOR_STOCKIST";
  }

  return value;
}

const TYPE_LABELS = {
  MR_HIRING: "MR Hiring",
  TERRITORY_EXPANSION: "Territory Expansion",
  DISTRIBUTION: "Distribution",
  PRODUCT_PROMOTION: "Product Promotion",
};

const ROLE_LABELS = {
  PHARMACY: "Pharmacy",
  PHARMA_COMPANY: "Pharma Company",
  COMPANY: "Pharma Company",
  MR: "Medical Representative",
  DISTRIBUTOR_STOCKIST: "Distributor / Stockist",
};

function getRoleLabel(role) {
  const normalized = normalizeRole(role);

  return ROLE_LABELS[normalized] || normalized.replaceAll("_", " ");
}

function getOpportunityTypeLabel(type) {
  return TYPE_LABELS[type] || String(type || "Opportunity").replaceAll("_", " ");
}

function getOpportunityIcon(type) {
  switch (type) {
    case "MR_HIRING":
      return UserRound;

    case "DISTRIBUTION":
      return Package;

    case "TERRITORY_EXPANSION":
      return MapPin;

    case "PRODUCT_PROMOTION":
      return BriefcaseBusiness;

    default:
      return BriefcaseBusiness;
  }
}


/* =========================================================
   PAGE
   ========================================================= */

export default function OpportunitiesPage() {
  const user = useAuthStore((s) => s.user);

  const role = normalizeRole(user?.role);
  const isPharmacy = role === "PHARMACY";
  const isCompany = role === "COMPANY" || role === "PHARMA_COMPANY";

  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadOpportunities() {
      setError(null);

      try {
        const result = await http.get("/opportunities?status=OPEN");

        if (!mounted) return;

        setItems(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!mounted) return;

        setItems([]);
        setError("Unable to load opportunities right now.");
      }
    }

    loadOpportunities();

    return () => {
      mounted = false;
    };
  }, []);

  const pageTitle = isPharmacy ? "Responses" : "Opportunities";

  const pageDescription = isPharmacy
    ? "Review relevant supplier opportunities and responses connected to your procurement needs."
    : "Discover relevant business opportunities across the PharmUnis network.";

  const emptyTitle = isPharmacy
    ? "No responses yet"
    : "No open opportunities right now";

  const emptySubtitle = isPharmacy
    ? "Responses will appear here when relevant opportunities become available."
    : isCompany
      ? "Create an opportunity to connect with relevant professionals and businesses."
      : "Check back soon for new opportunities.";

  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];

    return items;
  }, [items]);

  return (
    <div className="space-y-7">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col gap-5 rounded-[22px] border border-[#E9E2EA] bg-white p-5 shadow-[0_8px_28px_rgba(42,27,61,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <div
            className="
              mb-2
              font-nav
              text-[9px]
              uppercase
              tracking-[0.2em]
              text-primary
            "
          >
            {isPharmacy ? "Requirement Responses" : "Professional Network"}
          </div>

          <h1
            className="
              font-display
              text-2xl
              font-semibold
              tracking-tight
              text-[#2A1B3D]
              sm:text-3xl
            "
          >
            {pageTitle}
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              font-body
              text-xs
              leading-6
              text-[#6E6658]
            "
          >
            {pageDescription}
          </p>
        </div>

        {isCompany && (
          <Link to="/opportunities/create">
            <Button
              className="
                rounded-full
                bg-primary
                px-5
                py-3
                font-nav
                text-[9px]
                uppercase
                tracking-[0.12em]
                text-white
                shadow-[0_8px_24px_rgba(216,63,135,0.18)]
                hover:bg-[#44318D]
              "
            >
              Post Opportunity
            </Button>
          </Link>
        )}
      </div>


      {/* =====================================================
          CONTEXT CARD FOR PHARMACY
          ===================================================== */}

      {isPharmacy && (
        <div
          className="
            overflow-hidden
            rounded-[20px]
            border border-[#E9E6EC]
            bg-white
            shadow-[0_8px_30px_rgba(42,27,61,0.05)]
          "
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="flex items-start gap-4">

              <div
                className="
                  flex h-11 w-11 shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-[#D83F87]/10
                  text-[#D83F87]
                "
              >
                <ClipboardList size={21} strokeWidth={1.8} />
              </div>

              <div>
                <p
                  className="
                    font-support
                    text-base
                    font-semibold
                    text-[#2A1B3D]
                  "
                >
                  Your requirement responses
                </p>

                <p
                  className="
                    mt-1
                    max-w-xl
                    font-body
                    text-sm
                    leading-6
                    text-[#A4B3B6]
                  "
                >
                  Responses are connected to your procurement activity.
                  Open a response to review the supplier and continue toward
                  a connection.
                </p>
              </div>

            </div>

            <Link
              to="/requirements"
              className="
                inline-flex
                shrink-0
                items-center
                gap-2
                font-nav
                text-xs
                uppercase
                tracking-[0.12em]
                text-[#D83F87]
                transition-colors
                hover:text-[#44318D]
              "
            >
              View requirements
              <ChevronRight size={15} />
            </Link>

          </div>
        </div>
      )}


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          className="
            rounded-xl
            border border-[#E98074]/30
            bg-[#E98074]/10
            px-4 py-3
            font-body
            text-sm
            text-[#2A1B3D]
          "
        >
          {error}
        </div>
      )}


      {/* =====================================================
          LOADING
          ===================================================== */}

      {!items ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader />
        </div>
      ) : visibleItems.length === 0 ? (

        <Card
          className="
            border-[#E9E6EC]
            bg-white
            py-12
            shadow-[0_8px_30px_rgba(42,27,61,0.04)]
          "
        >
          <EmptyState
            title={emptyTitle}
            subtitle={emptySubtitle}
          />

          {isPharmacy && (
            <div className="mt-5 flex justify-center">
              <Link to="/requirements">
                <Button
                  className="
                    rounded-xl
                    bg-[#2A1B3D]
                    font-nav
                    text-white
                    hover:bg-[#44318D]
                  "
                >
                  View My Requirements
                </Button>
              </Link>
            </div>
          )}
        </Card>

      ) : (

        /* ===================================================
           OPPORTUNITY GRID
           =================================================== */

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {visibleItems.map((opportunity) => {
            const Icon = getOpportunityIcon(opportunity?.type);

            const categories = Array.isArray(opportunity?.categories)
              ? opportunity.categories
              : [];

            return (
              <Link
                key={opportunity.id}
                to={`/opportunities/${opportunity.id}`}
                className="group block h-full"
              >
                <Card
                  className="
                    relative
                    h-full
                    overflow-hidden
                    border-[#E9E6EC]
                    bg-white
                    shadow-[0_8px_30px_rgba(42,27,61,0.045)]
                    transition-all
                    duration-300
                    group-hover:-translate-y-1
                    group-hover:border-[#D83F87]/30
                    group-hover:shadow-[0_16px_40px_rgba(42,27,61,0.09)]
                  "
                >

                  {/* Accent line */}

                  <div
                    className="
                      absolute
                      inset-x-0
                      top-0
                      h-1
                      bg-gradient-to-r
                      from-[#D83F87]
                      via-[#44318D]
                      to-[#E98074]
                      opacity-70
                      transition-opacity
                      group-hover:opacity-100
                    "
                  />

                  <div className="p-5 sm:p-6">

                    {/* Top row */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-center gap-3">

                        <div
                          className="
                            flex h-10 w-10
                            shrink-0
                            items-center justify-center
                            rounded-xl
                            bg-[#F8F7F9]
                            text-[#44318D]
                            ring-1 ring-[#E9E6EC]
                            transition-all
                            duration-300
                            group-hover:bg-[#D83F87]/10
                            group-hover:text-[#D83F87]
                          "
                        >
                          <Icon size={19} strokeWidth={1.8} />
                        </div>

                        <div>
                          <span
                            className="
                              font-nav
                              text-[10px]
                              uppercase
                              tracking-[0.16em]
                              text-[#44318D]
                            "
                          >
                            {getOpportunityTypeLabel(opportunity?.type)}
                          </span>

                          {opportunity?.ownerRole && (
                            <p
                              className="
                                mt-0.5
                                font-body
                                text-xs
                                text-[#A4B3B6]
                              "
                            >
                              {getRoleLabel(opportunity.ownerRole)}
                            </p>
                          )}
                        </div>

                      </div>

                      <StatusBadge status={opportunity?.status} />

                    </div>


                    {/* Title */}

                    <h3
                      className="
                        mt-5
                        font-display
                        text-lg
                        font-semibold
                        leading-snug
                        text-[#2A1B3D]
                        transition-colors
                        group-hover:text-[#44318D]
                      "
                    >
                      {opportunity?.title || "Untitled opportunity"}
                    </h3>


                    {/* Description */}

                    {opportunity?.description && (
                      <p
                        className="
                          mt-2
                          line-clamp-3
                          font-body
                          text-sm
                          leading-6
                          text-[#A4B3B6]
                        "
                      >
                        {opportunity.description}
                      </p>
                    )}


                    {/* Categories */}

                    {categories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <span
                            key={category}
                            className="
                              rounded-full
                              border border-[#E9E6EC]
                              bg-[#F8F7F9]
                              px-2.5 py-1
                              font-nav
                              text-[10px]
                              uppercase
                              tracking-wide
                              text-[#44318D]
                            "
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}


                    {/* Footer */}

                    <div
                      className="
                        mt-5
                        flex
                        flex-col
                        gap-3
                        border-t
                        border-[#E9E6EC]
                        pt-4
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                      "
                    >

                      <div className="flex items-center gap-2">

                        {opportunity?.location && (
                          <>
                            <MapPin
                              size={14}
                              className="text-[#A4B3B6]"
                            />

                            <span
                              className="
                                max-w-[180px]
                                truncate
                                font-body
                                text-xs
                                text-[#A4B3B6]
                              "
                            >
                              {opportunity.location}
                            </span>
                          </>
                        )}

                        {!opportunity?.location && (
                          <>
                            <Building2
                              size={14}
                              className="text-[#A4B3B6]"
                            />

                            <span
                              className="
                                font-body
                                text-xs
                                text-[#A4B3B6]
                              "
                            >
                              PharmUnis Network
                            </span>
                          </>
                        )}

                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">

                        {opportunity?.createdAt && (
                          <span
                            className="
                              font-body
                              text-xs
                              text-[#A4B3B6]
                            "
                          >
                            {formatDistanceToNow(
                              new Date(opportunity.createdAt),
                              { addSuffix: true }
                            )}
                          </span>
                        )}

                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1
                            font-nav
                            text-[10px]
                            uppercase
                            tracking-[0.12em]
                            text-[#D83F87]
                            transition-transform
                            duration-200
                            group-hover:translate-x-1
                          "
                        >
                          View
                          <ChevronRight size={14} />
                        </span>

                      </div>

                    </div>

                  </div>
                </Card>
              </Link>
            );
          })}

        </div>
      )}
    </div>
  );
}