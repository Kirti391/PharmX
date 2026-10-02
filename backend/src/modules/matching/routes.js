const express = require("express");

const {
  asyncHandler,
  requireAuth,
} = require("../../common/middleware");

const {
  ok,
  fail,
  ApiError,
} = require("../../common/http");

const Requirement = require("../../models/Requirement");
const Opportunity = require("../../models/Opportunity");

const {
  matchForRequirement,
  matchForOpportunity,
} = require("./service");

const {
  getPharmacyProfileById,
} = require("../profiles/service");

const router = express.Router();

router.use(requireAuth);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeRole(role) {
  if (!role) return null;

  const normalized = String(role).toUpperCase();

  if (
    normalized === "DISTRIBUTOR" ||
    normalized === "STOCKIST" ||
    normalized === "DISTRIBUTOR_STOCKIST"
  ) {
    return "DISTRIBUTOR_STOCKIST";
  }

  if (
    normalized === "COMPANY" ||
    normalized === "PHARMA_COMPANY"
  ) {
    return "COMPANY";
  }

  if (normalized === "MR") {
    return "MR";
  }

  if (normalized === "PHARMACY") {
    return "PHARMACY";
  }

  return normalized;
}

/*
|--------------------------------------------------------------------------
| Requirement Ownership
|--------------------------------------------------------------------------
|
| Matching profiles are PRIVATE.
|
| Only the user who created the requirement can see:
|   - matching profiles
|   - match scores
|   - match reasons
|
*/

async function isRequirementOwner(requirement, user) {
  if (!requirement || !user) {
    return false;
  }

  const userRole = normalizeRole(user.role);

  /*
   * New ownership system.
   */
  if (requirement.ownerId && user.sub) {
    /*
     * Pharmacy requirements may store the PharmacyProfile ID
     * in ownerId. Resolve it back to the authenticated user.
     */
    if (userRole === "PHARMACY") {
      const pharmacy = await getPharmacyProfileById(
        requirement.ownerId
      );

      if (
        pharmacy &&
        pharmacy.userId &&
        pharmacy.userId.toString() ===
          user.sub.toString()
      ) {
        return true;
      }

      /*
       * Backward-compatible installations may store
       * the authenticated user ID directly.
       */
      if (
        requirement.ownerId.toString() ===
        user.sub.toString()
      ) {
        return true;
      }
    } else {
      /*
       * Company / MR / Distributor-Stockist requirements
       * should normally store the authenticated user ID.
       */
      if (
        requirement.ownerId.toString() ===
        user.sub.toString()
      ) {
        return true;
      }
    }
  }

  /*
   * Backward compatibility for older Pharmacy requirements
   * that only contain pharmacyId.
   */
  if (
    userRole === "PHARMACY" &&
    requirement.pharmacyId
  ) {
    const pharmacy = await getPharmacyProfileById(
      requirement.pharmacyId
    );

    if (
      pharmacy &&
      pharmacy.userId &&
      pharmacy.userId.toString() ===
        user.sub.toString()
    ) {
      return true;
    }
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| GET /for-requirement/:requirementId
|--------------------------------------------------------------------------
|
| PRIVATE ENDPOINT
|
| Only the requirement owner can retrieve matching profiles.
|
*/

router.get(
  "/for-requirement/:requirementId",
  asyncHandler(async (req, res) => {
    const requirement = await Requirement.findById(
      req.params.requirementId
    );

    if (!requirement) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Requirement not found"
      );
    }

    const owner = await isRequirementOwner(
      requirement,
      req.user
    );

    /*
     * CRITICAL SECURITY RULE:
     *
     * Never return matching profiles, scores, or
     * reasons to anyone other than the requirement owner.
     */
    if (!owner) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only the requirement owner can view matching profiles"
      );
    }

    /*
     * matchForRequirement() is responsible for applying
     * targetRole filtering.
     */
    const matches = await matchForRequirement(
      requirement._id
    );

    return ok(res, matches);
  })
);

/*
|--------------------------------------------------------------------------
| GET /for-opportunity/:opportunityId
|--------------------------------------------------------------------------
|
| Existing opportunity matching behavior.
|
*/

router.get(
  "/for-opportunity/:opportunityId",
  asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(
      req.params.opportunityId
    );

    if (!opportunity) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Opportunity not found"
      );
    }

    const matches = await matchForOpportunity(
      opportunity._id
    );

    return ok(res, matches);
  })
);

/*
|--------------------------------------------------------------------------
| GET /recommendations
|--------------------------------------------------------------------------
|
| Recommendations are NOT the private matching workspace.
|
| A target-role user can receive recommendations for
| requirements explicitly targeting their role.
|
| We return only that user's own match.
| We never return the complete list of matching profiles.
|
*/

router.get(
  "/recommendations",
  asyncHandler(async (req, res) => {
    const userId = req.user.sub;
    const userRole = normalizeRole(req.user.role);

    /*
     * Pharmacies create requirements, while the target role
     * receives recommendations.
     *
     * A Pharmacy should therefore not receive its own
     * procurement requirements as supplier recommendations.
     */
    const openRequirements =
      userRole && userRole !== "PHARMACY"
        ? await Requirement.find({
            status: "OPEN",
            targetRole: userRole,
          })
            .sort({
              createdAt: -1,
            })
            .limit(50)
        : [];

    const openOpportunities = await Opportunity.find({
      status: "OPEN",
    })
      .sort({
        createdAt: -1,
      })
      .limit(50);

    const requirementMatches = [];

    /*
     * Evaluate only requirements targeting the current
     * authenticated user's role.
     */
    for (const requirement of openRequirements) {
      const matches = await matchForRequirement(
        requirement._id
      );

      const mine = matches.find(
        (match) =>
          match.userId &&
          match.userId.toString() ===
            userId.toString()
      );

      if (mine) {
        requirementMatches.push({
          requirementId: requirement._id,
          score: mine.score,
          reasons: mine.reasons,
        });
      }
    }

    const opportunityMatches = [];

    for (const opportunity of openOpportunities) {
      const matches = await matchForOpportunity(
        opportunity._id
      );

      const mine = matches.find(
        (match) =>
          match.userId &&
          match.userId.toString() ===
            userId.toString()
      );

      if (mine) {
        opportunityMatches.push({
          opportunityId: opportunity._id,
          score: mine.score,
          reasons: mine.reasons,
        });
      }
    }

    return ok(res, {
      requirementMatches: requirementMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),

      opportunityMatches: opportunityMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
    });
  })
);

module.exports = router;