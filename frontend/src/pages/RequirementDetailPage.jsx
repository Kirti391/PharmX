import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  MessageSquare,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { http } from "../lib/api";
import {
  Card,
  Loader,
  StatusBadge,
} from "../components/ui";
import { ConnectButton } from "../components/discovery";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  coral: "#E98074",
  muted: "#A4B3B6",
  background: "#F8F7F9",
  border: "#E9E6EC",
};

function formatDate(value) {
  if (!value) return "Recently";

  try {
    return format(new Date(value), "d MMM yyyy");
  } catch {
    return "Recently";
  }
}

function formatSupplierType(type) {
  const normalized = String(type || "").toUpperCase();

  if (
    normalized === "DISTRIBUTOR" ||
    normalized === "STOCKIST" ||
    normalized === "DISTRIBUTOR_STOCKIST"
  ) {
    return "Distributors & Stockists";
  }

  if (
    normalized === "PHARMA_COMPANY" ||
    normalized === "COMPANY"
  ) {
    return "Pharma Company";
  }

  if (
    normalized === "MR" ||
    normalized === "MEDICAL_REPRESENTATIVE"
  ) {
    return "Medical Representative";
  }

  return normalized.replaceAll("_", " ") || "Healthcare Partner";
}

function SupplierIcon({ type, size = 18 }) {
  const normalized = String(type || "").toUpperCase();

  if (
    normalized === "DISTRIBUTOR" ||
    normalized === "STOCKIST" ||
    normalized === "DISTRIBUTOR_STOCKIST"
  ) {
    return <Truck size={size} />;
  }

  if (
    normalized === "MR" ||
    normalized === "MEDICAL_REPRESENTATIVE"
  ) {
    return <Stethoscope size={size} />;
  }

  return <Building2 size={size} />;
}

function getMatchName(match) {
  return (
    match.name ||
    match.companyName ||
    match.businessName ||
    "Healthcare Partner"
  );
}

function getLocation(match) {
  if (typeof match.location === "string") {
    return match.location;
  }

  if (match.location?.city) {
    return [
      match.location.city,
      match.location.state,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return match.city || match.serviceArea || null;
}

function getMatchScore(match) {
  if (typeof match.score !== "number") return null;

  return Math.round(match.score * 100);
}

function MatchCard({ match }) {
  const supplierType = formatSupplierType(match.targetType);
  const score = getMatchScore(match);
  const location = getLocation(match);
  const name = getMatchName(match);

  const reasons = Array.isArray(match.reasons)
    ? match.reasons
    : [];

  return (
    <Card className="group border-[#E9E6EC] bg-white p-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor:
                  supplierType === "Distributors & Stockists"
                    ? "#FDF0ED"
                    : supplierType === "Medical Representative"
                      ? "#F1ECFA"
                      : "#FCE8F1",
                color:
                  supplierType === "Distributors & Stockists"
                    ? COLORS.coral
                    : supplierType === "Medical Representative"
                      ? COLORS.purple
                      : COLORS.primary,
              }}
            >
              <SupplierIcon type={match.targetType} size={21} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-1 font-[Unica_One] text-[9px] uppercase tracking-[0.1em]"
                  style={{
                    backgroundColor: "#F8F7F9",
                    color: COLORS.muted,
                  }}
                >
                  {supplierType}
                </span>

                {match.verified && (
                  <span
                    className="flex items-center gap-1 font-[Fauna_One] text-[10px]"
                    style={{ color: COLORS.purple }}
                  >
                    <ShieldCheck size={12} />
                    Verified
                  </span>
                )}
              </div>

              <h3
                className="mt-2 font-[Cinzel] text-base font-semibold"
                style={{ color: COLORS.navy }}
              >
                {name}
              </h3>

              {location && (
                <div
                  className="mt-1.5 flex items-center gap-1.5 font-[Fauna_One] text-xs"
                  style={{ color: COLORS.muted }}
                >
                  <MapPin size={13} />
                  {location}
                </div>
              )}
            </div>
          </div>

          {score !== null && (
            <div className="shrink-0">
              <div
                className="rounded-xl px-3 py-2 text-center"
                style={{
                  backgroundColor: "#FCE8F1",
                  color: COLORS.primary,
                }}
              >
                <p className="font-[Cinzel] text-lg font-semibold">
                  {score}%
                </p>
                <p className="font-[Unica_One] text-[8px] uppercase tracking-[0.1em]">
                  Match
                </p>
              </div>
            </div>
          )}
        </div>

        {reasons.length > 0 && (
          <div
            className="mt-5 rounded-xl border p-4"
            style={{
              borderColor: COLORS.border,
              backgroundColor: "#FCFBFD",
            }}
          >
            <p
              className="font-[Unica_One] text-[9px] uppercase tracking-[0.15em]"
              style={{ color: COLORS.muted }}
            >
              Why this partner matches
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {reasons.slice(0, 4).map((reason, index) => (
                <div
                  key={`${reason}-${index}`}
                  className="flex items-start gap-2"
                >
                  <CheckCircle2
                    size={14}
                    className="mt-0.5 shrink-0"
                    style={{ color: COLORS.primary }}
                  />

                  <span
                    className="font-[Fauna_One] text-[10px] leading-4"
                    style={{ color: COLORS.navy }}
                  >
                    {reason}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: COLORS.border }}
        >
          <Link
            to={`/discover/${String(match.targetType || "").toLowerCase()}`}
            className="flex items-center gap-1 font-[Unica_One] text-[10px] uppercase tracking-[0.08em]"
            style={{ color: COLORS.primary }}
          >
            View profile
            <ArrowRight size={13} />
          </Link>

          {match.userId && (
            <ConnectButton recipientUserId={match.userId} />
          )}
        </div>
      </div>
    </Card>
  );
}

export default function RequirementDetailPage() {
  const { id } = useParams();

  const [requirement, setRequirement] = useState(null);
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      http
        .get(`/requirements/${id}`)
        .catch(() => null),

      http
        .get(`/matching/for-requirement/${id}`)
        .catch(() => []),
    ]).then(([requirementData, matchData]) => {
      if (!mounted) return;

      setRequirement(requirementData);
      setMatches(Array.isArray(matchData) ? matchData : []);
    });

    return () => {
      mounted = false;
    };
  }, [id]);

  const sortedMatches = useMemo(() => {
    if (!Array.isArray(matches)) return [];

    return [...matches].sort((a, b) => {
      const scoreA =
        typeof a.score === "number" ? a.score : 0;

      const scoreB =
        typeof b.score === "number" ? b.score : 0;

      return scoreB - scoreA;
    });
  }, [matches]);

  if (!requirement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  const products = Array.isArray(requirement.products)
    ? requirement.products
    : Array.isArray(requirement.molecules)
      ? requirement.molecules
      : [];

  const location =
    typeof requirement.location === "string"
      ? requirement.location
      : requirement.location?.city
        ? [
            requirement.location.city,
            requirement.location.state,
          ]
            .filter(Boolean)
            .join(", ")
        : requirement.city;

  return (
    <div className="space-y-7 pb-10">
      {/* BACK */}
      <Link
        to="/requirements"
        className="inline-flex items-center gap-2 font-[Unica_One] text-[10px] uppercase tracking-[0.12em] transition hover:gap-3"
        style={{ color: COLORS.muted }}
      >
        <ArrowLeft size={14} />
        Back to Requirements
      </Link>

      {/* REQUIREMENT HERO */}
      <section
        className="relative overflow-hidden rounded-[26px] border bg-white"
        style={{ borderColor: COLORS.border }}
      >
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: COLORS.primary }}
        />

        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 font-[Unica_One] text-[9px] uppercase tracking-[0.12em]"
                  style={{
                    backgroundColor: "#F1ECFA",
                    color: COLORS.purple,
                  }}
                >
                  {requirement.category || "General"}
                </span>

                {requirement.urgency && (
                  <span
                    className="rounded-full px-3 py-1 font-[Unica_One] text-[9px] uppercase tracking-[0.12em]"
                    style={{
                      backgroundColor:
                        String(requirement.urgency).toUpperCase() ===
                        "HIGH"
                          ? "#FCE8F1"
                          : "#F8F7F9",
                      color:
                        String(requirement.urgency).toUpperCase() ===
                        "HIGH"
                          ? COLORS.primary
                          : COLORS.muted,
                    }}
                  >
                    {requirement.urgency} urgency
                  </span>
                )}

                <StatusBadge status={requirement.status} />
              </div>

              <h1
                className="mt-4 font-[Cinzel] text-2xl font-semibold leading-tight sm:text-3xl"
                style={{ color: COLORS.navy }}
              >
                {requirement.title}
              </h1>

              <div
                className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-[Fauna_One] text-xs"
                style={{ color: COLORS.muted }}
              >
                <span className="flex items-center gap-1.5">
                  <Clock3 size={13} />
                  Posted {formatDate(requirement.createdAt)}
                </span>

                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    {location}
                  </span>
                )}
              </div>
            </div>

            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "#FCE8F1",
                color: COLORS.primary,
              }}
            >
              <PackageSearch size={25} strokeWidth={1.6} />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div
            className="mt-7 rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: COLORS.border,
              backgroundColor: "#FCFBFD",
            }}
          >
            <div className="flex items-center gap-2">
              <FileText
                size={16}
                style={{ color: COLORS.primary }}
              />

              <p
                className="font-[Unica_One] text-[9px] uppercase tracking-[0.15em]"
                style={{ color: COLORS.muted }}
              >
                Requirement details
              </p>
            </div>

            <p
              className="mt-3 whitespace-pre-line font-[Fauna_One] text-sm leading-7"
              style={{ color: COLORS.navy }}
            >
              {requirement.description ||
                requirement.additionalInfo ||
                "No additional details provided."}
            </p>
          </div>

          {/* PRODUCTS */}
          {products.length > 0 && (
            <div className="mt-5">
              <p
                className="font-[Unica_One] text-[9px] uppercase tracking-[0.15em]"
                style={{ color: COLORS.muted }}
              >
                Products / Molecules
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {products.map((product, index) => {
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
                      className="rounded-xl border px-3 py-2 font-[Fauna_One] text-xs"
                      style={{
                        borderColor: COLORS.border,
                        backgroundColor: "#FFFFFF",
                        color: COLORS.navy,
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MATCHING HEADER */}
      <section>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={16}
                style={{ color: COLORS.primary }}
              />

              <p
                className="font-[Unica_One] text-[10px] uppercase tracking-[0.18em]"
                style={{ color: COLORS.primary }}
              >
                PharmUnis Matching
              </p>
            </div>

            <h2
              className="mt-1 font-[Cinzel] text-xl font-semibold"
              style={{ color: COLORS.navy }}
            >
              Potential Partners
            </h2>

            <p
              className="mt-1 font-[Fauna_One] text-xs"
              style={{ color: COLORS.muted }}
            >
              Relevant companies, representatives and supply partners for
              this requirement.
            </p>
          </div>

          {Array.isArray(matches) && (
            <div
              className="rounded-xl px-3 py-2 font-[Unica_One] text-[9px] uppercase tracking-[0.1em]"
              style={{
                backgroundColor: "#F1ECFA",
                color: COLORS.purple,
              }}
            >
              {sortedMatches.length}{" "}
              {sortedMatches.length === 1
                ? "potential match"
                : "potential matches"}
            </div>
          )}
        </div>
      </section>

      {/* MATCHES */}
      {!matches ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-2xl border bg-white">
          <Loader />
        </div>
      ) : sortedMatches.length === 0 ? (
        <Card className="border-[#E9E6EC] bg-white">
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "#FCE8F1",
                color: COLORS.primary,
              }}
            >
              <Search size={23} />
            </div>

            <h3
              className="mt-5 font-[Cinzel] text-base font-semibold"
              style={{ color: COLORS.navy }}
            >
              No strong matches yet
            </h3>

            <p
              className="mt-2 max-w-md font-[Fauna_One] text-xs leading-6"
              style={{ color: COLORS.muted }}
            >
              As more relevant profiles become available on PharmUnis,
              matching partners may appear here.
            </p>

            <Link
              to="/discover/companies"
              className="mt-5 flex items-center gap-2 font-[Unica_One] text-xs uppercase tracking-[0.08em]"
              style={{ color: COLORS.primary }}
            >
              Explore the network
              <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedMatches.map((match) => (
            <MatchCard
              key={`${match.targetType}-${match.targetId}`}
              match={match}
            />
          ))}
        </div>
      )}

      {/* PROCUREMENT NEXT STEP */}
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
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className="text-white/60"
              />

              <p className="font-[Unica_One] text-[9px] uppercase tracking-[0.18em] text-white/50">
                Next step
              </p>
            </div>

            <h3 className="mt-2 font-[Cinzel] text-base font-semibold text-white">
              Review matches and start a conversation.
            </h3>

            <p className="mt-1 max-w-xl font-[Fauna_One] text-xs leading-5 text-white/55">
              Connect with the right partner, discuss your requirement and
              move toward procurement.
            </p>
          </div>

          <Link to="/discover/companies" className="shrink-0">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D83F87] px-5 py-3 font-[Unica_One] text-xs uppercase tracking-[0.08em] text-white transition hover:bg-[#c93679] sm:w-auto"
            >
              <Users size={16} />
              Discover Partners
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}