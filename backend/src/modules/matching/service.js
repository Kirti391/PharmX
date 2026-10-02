const Requirement = require("../../models/Requirement");
const Opportunity = require("../../models/Opportunity");

const {
  getPharmacyProfileById,
  listMRs,
  listPharmaCompanies,
  listStockists,
} = require("../profiles/service");

const WEIGHTS = {
  category: 0.5,
  territory: 0.35,
  availability: 0.15,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeRole(role) {
  if (!role) return null;

  const normalized = String(role).toUpperCase();

  /*
   * Distributor and Stockist are intentionally ONE role
   * throughout the matching system.
   */
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

function textIncludes(haystack, needle) {
  if (!needle) return false;

  const values = Array.isArray(haystack)
    ? haystack
    : haystack
      ? [haystack]
      : [];

  const search = String(needle).toLowerCase();

  return values.some((value) => {
    if (!value) return false;

    const text = String(value).toLowerCase();

    return (
      text.includes(search) ||
      search.includes(text)
    );
  });
}

function getPharmacyLocation(pharmacy) {
  if (!pharmacy) return "";

  if (typeof pharmacy.location === "string") {
    return pharmacy.location;
  }

  if (
    pharmacy.location &&
    typeof pharmacy.location === "object"
  ) {
    return [
      pharmacy.location.city,
      pharmacy.location.state,
      pharmacy.location.district,
      pharmacy.location.address,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return [
    pharmacy.city,
    pharmacy.state,
    pharmacy.district,
  ]
    .filter(Boolean)
    .join(", ");
}

/*
|--------------------------------------------------------------------------
| MR Matching
|--------------------------------------------------------------------------
*/

async function matchMRs(requirement, pharmacy) {
  const results = [];

  const pharmacyLocation =
    getPharmacyLocation(pharmacy);

  const mrs = await listMRs({});

  for (const mr of mrs) {
    let score = 0;
    const reasons = [];

    if (
      textIncludes(
        mr.specializations,
        requirement.category
      )
    ) {
      score += WEIGHTS.category;

      reasons.push(
        `Specializes in ${requirement.category}`
      );
    }

    if (
      pharmacyLocation &&
      textIncludes(
        mr.territories,
        pharmacyLocation
      )
    ) {
      score += WEIGHTS.territory;

      reasons.push(
        `Covers ${pharmacyLocation}`
      );
    }

    if (
      mr.availabilityStatus ===
      "AVAILABLE"
    ) {
      score += WEIGHTS.availability;

      reasons.push(
        "Currently available"
      );
    }

    if (score > 0) {
      results.push({
        targetType: "MR",
        targetId: mr.id,
        userId: mr.userId,
        name: mr.fullName,
        score,
        reasons,
      });
    }
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| Pharma Company Matching
|--------------------------------------------------------------------------
*/

async function matchCompanies(
  requirement,
  pharmacy
) {
  const results = [];

  const pharmacyLocation =
    getPharmacyLocation(pharmacy);

  const companies =
    await listPharmaCompanies({});

  for (const company of companies) {
    let score = 0;
    const reasons = [];

    if (
      textIncludes(
        company.productCategories,
        requirement.category
      )
    ) {
      score += WEIGHTS.category;

      reasons.push(
        `Manufactures ${requirement.category} products`
      );
    }

    if (
      pharmacyLocation &&
      textIncludes(
        company.areasOfOperation,
        pharmacyLocation
      )
    ) {
      score += WEIGHTS.territory;

      reasons.push(
        `Operates in ${pharmacyLocation}`
      );
    }

    if (score > 0) {
      results.push({
        targetType: "COMPANY",
        targetId: company.id,
        userId: company.userId,
        name: company.companyName,
        score,
        reasons,
      });
    }
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| Distributor / Stockist Matching
|--------------------------------------------------------------------------
*/

async function matchDistributorStockists(
  requirement,
  pharmacy
) {
  const results = [];

  const pharmacyLocation =
    getPharmacyLocation(pharmacy);

  const stockists =
    await listStockists({});

  for (const stockist of stockists) {
    let score = 0;
    const reasons = [];

    if (
      textIncludes(
        stockist.productCategories,
        requirement.category
      )
    ) {
      score += WEIGHTS.category;

      reasons.push(
        `Stocks ${requirement.category} products`
      );
    }

    if (
      pharmacyLocation &&
      textIncludes(
        stockist.serviceAreas,
        pharmacyLocation
      )
    ) {
      score += WEIGHTS.territory;

      reasons.push(
        `Services ${pharmacyLocation}`
      );
    }

    if (score > 0) {
      results.push({
        targetType: "DISTRIBUTOR_STOCKIST",
        targetId: stockist.id,
        userId: stockist.userId,
        name: stockist.companyName,
        score,
        reasons,
      });
    }
  }

  return results;
}

/*
|--------------------------------------------------------------------------
| Requirement Target Role
|--------------------------------------------------------------------------
|
| New requirements store targetRole.
|
| supplierType is supported as a fallback for compatibility with
| older code/data where that value may still be present.
|
*/

function getRequirementTargetRole(requirement) {
  return normalizeRole(
    requirement?.targetRole ||
      requirement?.supplierType
  );
}

/*
|--------------------------------------------------------------------------
| Match Requirement
|--------------------------------------------------------------------------
|
| Target-role rules:
|
| COMPANY
|   -> only pharma companies
|
| MR
|   -> only medical representatives
|
| DISTRIBUTOR_STOCKIST
|   -> only distributors / stockists
|
| No targeted requirement searches all three groups.
|
*/

async function matchForRequirement(
  requirementId
) {
  const requirement =
    await Requirement.findById(
      requirementId
    );

  if (!requirement) {
    return [];
  }

  /*
   * Current Pharmacy requirements require a pharmacy
   * profile in order to calculate territory matching.
   *
   * Keep this compatible with existing records.
   */
  if (!requirement.pharmacyId) {
    return [];
  }

  const pharmacy =
    await getPharmacyProfileById(
      requirement.pharmacyId
    );

  if (!pharmacy) {
    return [];
  }

  const targetRole =
    getRequirementTargetRole(
      requirement
    );

  /*
   * IMPORTANT:
   *
   * Once targetRole exists, only that supplier category
   * is queried.
   */
  if (targetRole === "MR") {
    const results =
      await matchMRs(
        requirement,
        pharmacy
      );

    return results
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 20);
  }

  if (targetRole === "COMPANY") {
    const results =
      await matchCompanies(
        requirement,
        pharmacy
      );

    return results
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 20);
  }

  if (
    targetRole ===
    "DISTRIBUTOR_STOCKIST"
  ) {
    const results =
      await matchDistributorStockists(
        requirement,
        pharmacy
      );

    return results
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 20);
  }

  /*
   * Legacy behavior.
   *
   * Only requirements with no recognized target role reach
   * this branch. Existing old requirements can therefore
   * continue working.
   *
   * New requirements should always have targetRole.
   */
  const legacyResults = [];

  legacyResults.push(
    ...(await matchMRs(
      requirement,
      pharmacy
    ))
  );

  legacyResults.push(
    ...(await matchCompanies(
      requirement,
      pharmacy
    ))
  );

  legacyResults.push(
    ...(await matchDistributorStockists(
      requirement,
      pharmacy
    ))
  );

  return legacyResults
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 20);
}

/*
|--------------------------------------------------------------------------
| Match Opportunity
|--------------------------------------------------------------------------
|
| Existing opportunity matching remains separate from
| procurement requirement matching.
|
*/

async function matchForOpportunity(
  opportunityId
) {
  const opportunity =
    await Opportunity.findById(
      opportunityId
    );

  if (!opportunity) {
    return [];
  }

  const {
    categories = [],
    territories = [],
  } = opportunity;

  const results = [];

  for (
    const mr of
    await listMRs({})
  ) {
    let score = 0;
    const reasons = [];

    if (
      categories.some((category) =>
        textIncludes(
          mr.specializations,
          category
        )
      )
    ) {
      score +=
        WEIGHTS.category;

      reasons.push(
        "Specialization matches opportunity categories"
      );
    }

    if (
      territories.some((territory) =>
        textIncludes(
          mr.territories,
          territory
        )
      )
    ) {
      score +=
        WEIGHTS.territory;

      reasons.push(
        "Territory overlap with opportunity"
      );
    }

    if (
      mr.availabilityStatus ===
      "AVAILABLE"
    ) {
      score +=
        WEIGHTS.availability;

      reasons.push(
        "Currently available"
      );
    }

    if (score > 0) {
      results.push({
        targetType: "MR",
        targetId: mr.id,
        userId: mr.userId,
        name: mr.fullName,
        score,
        reasons,
      });
    }
  }

  return results
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 20);
}

module.exports = {
  matchForRequirement,
  matchForOpportunity,
};