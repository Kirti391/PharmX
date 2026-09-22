const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ok } = require("../../common/http");
const Requirement = require("../../models/Requirement");
const Opportunity = require("../../models/Opportunity");
const { matchForRequirement, matchForOpportunity } = require("./service");

const router = express.Router();
router.use(requireAuth);

router.get("/for-requirement/:requirementId", asyncHandler(async (req, res) => {
  ok(res, await matchForRequirement(req.params.requirementId));
}));

router.get("/for-opportunity/:opportunityId", asyncHandler(async (req, res) => {
  ok(res, await matchForOpportunity(req.params.opportunityId));
}));

router.get("/recommendations", asyncHandler(async (req, res) => {
  const userId = req.user.sub;
  const openRequirements = await Requirement.find({ status: "OPEN" }).sort({ createdAt: -1 }).limit(50);
  const openOpportunities = await Opportunity.find({ status: "OPEN" }).sort({ createdAt: -1 }).limit(50);

  const requirementMatches = [];
  for (const r of openRequirements) {
    const matches = await matchForRequirement(r._id);
    const mine = matches.find((m) => m.userId.toString() === userId);
    if (mine) requirementMatches.push({ requirementId: r._id, score: mine.score, reasons: mine.reasons });
  }

  const opportunityMatches = [];
  for (const o of openOpportunities) {
    const matches = await matchForOpportunity(o._id);
    const mine = matches.find((m) => m.userId.toString() === userId);
    if (mine) opportunityMatches.push({ opportunityId: o._id, score: mine.score, reasons: mine.reasons });
  }

  ok(res, {
    requirementMatches: requirementMatches.sort((a, b) => b.score - a.score).slice(0, 10),
    opportunityMatches: opportunityMatches.sort((a, b) => b.score - a.score).slice(0, 10),
  });
}));

module.exports = router;
