const Requirement = require("../../models/Requirement");
const Opportunity = require("../../models/Opportunity");
const { getPharmacyProfileById, listMRs, listPharmaCompanies, listStockists } = require("../profiles/service");

const WEIGHTS = { category: 0.5, territory: 0.35, availability: 0.15 };

function textIncludes(haystack, needle) {
  const n = needle.toLowerCase();
  return haystack.some((h) => h.toLowerCase().includes(n) || n.includes(h.toLowerCase()));
}

async function matchForRequirement(requirementId) {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) return [];
  const pharmacy = await getPharmacyProfileById(requirement.pharmacyId);

  const results = [];

  for (const mr of await listMRs({})) {
    let score = 0;
    const reasons = [];
    if (textIncludes(mr.specializations, requirement.category)) {
      score += WEIGHTS.category;
      reasons.push(`Specializes in ${requirement.category}`);
    }
    if (textIncludes(mr.territories, pharmacy.location)) {
      score += WEIGHTS.territory;
      reasons.push(`Covers ${pharmacy.location}`);
    }
    if (mr.availabilityStatus === "AVAILABLE") {
      score += WEIGHTS.availability;
      reasons.push("Currently available");
    }
    if (score > 0) results.push({ targetType: "MR", targetId: mr.id, userId: mr.userId, name: mr.fullName, score, reasons });
  }

  for (const company of await listPharmaCompanies({})) {
    let score = 0;
    const reasons = [];
    if (textIncludes(company.productCategories, requirement.category)) {
      score += WEIGHTS.category;
      reasons.push(`Manufactures ${requirement.category} products`);
    }
    if (textIncludes(company.areasOfOperation, pharmacy.location)) {
      score += WEIGHTS.territory;
      reasons.push(`Operates in ${pharmacy.location}`);
    }
    if (score > 0) {
      results.push({ targetType: "PHARMA_COMPANY", targetId: company.id, userId: company.userId, name: company.companyName, score, reasons });
    }
  }

  for (const stockist of await listStockists({})) {
    let score = 0;
    const reasons = [];
    if (textIncludes(stockist.productCategories, requirement.category)) {
      score += WEIGHTS.category;
      reasons.push(`Stocks ${requirement.category} products`);
    }
    if (textIncludes(stockist.serviceAreas, pharmacy.location)) {
      score += WEIGHTS.territory;
      reasons.push(`Services ${pharmacy.location}`);
    }
    if (score > 0) {
      results.push({
        targetType: stockist.type === "DISTRIBUTOR" ? "DISTRIBUTOR" : "STOCKIST",
        targetId: stockist.id,
        userId: stockist.userId,
        name: stockist.companyName,
        score,
        reasons,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

async function matchForOpportunity(opportunityId) {
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) return [];
  const { categories, territories } = opportunity;

  const results = [];
  for (const mr of await listMRs({})) {
    let score = 0;
    const reasons = [];
    if (categories.some((c) => textIncludes(mr.specializations, c))) {
      score += WEIGHTS.category;
      reasons.push("Specialization matches opportunity categories");
    }
    if (territories.some((t) => textIncludes(mr.territories, t))) {
      score += WEIGHTS.territory;
      reasons.push("Territory overlap with opportunity");
    }
    if (mr.availabilityStatus === "AVAILABLE") {
      score += WEIGHTS.availability;
      reasons.push("Currently available");
    }
    if (score > 0) results.push({ targetType: "MR", targetId: mr.id, userId: mr.userId, name: mr.fullName, score, reasons });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

module.exports = { matchForRequirement, matchForOpportunity };
