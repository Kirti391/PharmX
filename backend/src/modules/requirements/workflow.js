const {
  MR_SUPPORT_REQUEST_TYPES,
  PRODUCT_CATEGORIES,
} = require("../../common/constants");

function getRequirementStage(
  requirement,
  responses,
  connectedResponderIds
) {
  const hasConnectedResponder = responses.some((response) =>
    connectedResponderIds.has(response.responderUserId.toString())
  );
  const hasShortlistedResponse = responses.some(
    (response) => response.status === "SHORTLISTED"
  );

  if (requirement.status === "CLOSED") return "CLOSED";
  if (requirement.status === "FULFILLED" || requirement.fulfilledAt) {
    return "FULFILLED";
  }
  if (hasConnectedResponder) return "CONNECTED";
  if (hasShortlistedResponse) return "SHORTLISTED";
  if (responses.length > 0) return "RESPONSES";
  if ((requirement.matchingCount ?? 0) > 0 || requirement.status === "MATCHED") {
    return "MATCHING";
  }
  return "OPEN";
}

function getMRSupportRequestValidationError(
  targetRole,
  category,
  requestType
) {
  if (targetRole !== "MR") {
    return requestType ? "REQUEST_TYPE_NOT_ALLOWED" : null;
  }

  if (!PRODUCT_CATEGORIES.includes(category)) {
    return "INVALID_THERAPEUTIC_AREA";
  }

  if (!MR_SUPPORT_REQUEST_TYPES.includes(requestType)) {
    return "REQUEST_TYPE_REQUIRED";
  }

  return null;
}

module.exports = {
  getRequirementStage,
  getMRSupportRequestValidationError,
};
