import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";

import { Card } from "../ui";
import { getMRSupportRequestLabel } from "../../lib/constants";

const COLORS = {
  primary: "#D83F87",
  navy: "#2A1B3D",
  purple: "#44318D",
  muted: "#8C8496",
  border: "#E9E2EA",
};

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

const STAGE_LABELS = {
  OPEN: "Open",
  MATCHING: "Matching",
  RESPONSES: "Responses",
  SHORTLISTED: "Shortlisted",
  CONNECTED: "Connected",
  FULFILLED: "Fulfilled",
  CLOSED: "Closed",
};

function formatCreatedAt(value) {
  if (!value) return "Recently created";

  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
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
    return [requirement.location.city, requirement.location.state]
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

function productLabel(product) {
  return typeof product === "string"
    ? product
    : product?.name || product?.molecule || product?.productName || "";
}

export default function RequirementSummaryCard({ requirement }) {
  const isMRTargetedRequest = requirement.targetRole === "MR";
  const isMRSupportRequest =
    isMRTargetedRequest && Boolean(requirement.requestType);
  const isLegacyMRRequest =
    isMRTargetedRequest && !requirement.requestType;
  const urgency =
    URGENCY_STYLES[normalizeStatus(requirement.urgency)] ||
    URGENCY_STYLES.NORMAL;
  const responseCount = getResponseCount(requirement);
  const location = getRequirementLocation(requirement);
  const products = getRequirementProducts(requirement);
  const stage = normalizeStatus(
    requirement.pipelineStage || requirement.status
  );
  const stageLabel =
    isMRTargetedRequest && stage === "FULFILLED"
      ? "Completed"
      : STAGE_LABELS[stage] || stage;

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
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2.5 py-1 font-[Philosopher] text-[9px] uppercase tracking-[0.12em]"
                style={{
                  backgroundColor: "#F1ECFA",
                  color: COLORS.purple,
                }}
              >
                {isMRSupportRequest
                  ? `Therapeutic area: ${requirement.category || "General"}`
                  : isLegacyMRRequest
                    ? `Legacy category: ${requirement.category || "General"}`
                    : requirement.category || "General"}
              </span>
              {isMRSupportRequest && (
                <span
                  className="rounded-full px-2.5 py-1 font-[Philosopher] text-[9px] uppercase tracking-[0.1em]"
                  style={{
                    backgroundColor: "#FCE8F1",
                    color: COLORS.primary,
                  }}
                >
                  {getMRSupportRequestLabel(requirement.requestType)}
                </span>
              )}
              {isLegacyMRRequest && (
                <span
                  className="rounded-full px-2.5 py-1 font-[Philosopher] text-[9px] uppercase tracking-[0.1em]"
                  style={{
                    backgroundColor: "#FFF4E5",
                    color: "#8A5A00",
                  }}
                >
                  Legacy MR request
                </span>
              )}
              <span
                className="rounded-full bg-[#F8F7F9] px-2.5 py-1 font-[Philosopher] text-[9px] uppercase tracking-[0.1em]"
                style={{ color: COLORS.navy }}
              >
                {stageLabel}
              </span>
            </div>

            <span
              className="rounded-full px-2.5 py-1 font-[Philosopher] text-[9px] uppercase tracking-[0.1em]"
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
                const label = productLabel(product);
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

          {(location ||
            (responseCount !== null && responseCount !== undefined)) && (
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
          )}

          <div className="mt-4 flex items-center justify-between">
            <span
              className="flex items-center gap-1.5 font-[Fauna_One] text-[10px]"
              style={{ color: COLORS.muted }}
            >
              <Clock3 size={12} />
              {formatCreatedAt(requirement.createdAt)}
            </span>

            <div
              className="flex items-center gap-1 font-[Philosopher] text-[10px] uppercase tracking-[0.1em] transition-all group-hover:gap-2"
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
