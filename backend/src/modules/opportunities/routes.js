const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth, requireRole } = require("../../common/middleware");
const { created, fail, ok, ApiError } = require("../../common/http");
const Opportunity = require("../../models/Opportunity");
const OpportunityApplication = require("../../models/OpportunityApplication");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const User = require("../../models/User");
const { getPharmaProfileByUserId } = require("../profiles/service");
const { matchForOpportunity } = require("../matching/service");
const { createNotification } = require("../notifications/service");

const router = express.Router();
router.use(requireAuth);

const createSchema = z.object({
  type: z.enum(["MR_HIRING", "TERRITORY_EXPANSION", "DISTRIBUTION", "PRODUCT_PROMOTION"]),
  title: z.string().min(3),
  description: z.string().min(5),
  categories: z.array(z.string()).default([]),
  territories: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

function serialize(o) {
  return {
    id: o._id,
    companyId: o.companyId,
    type: o.type,
    title: o.title,
    description: o.description,
    categories: o.categories,
    territories: o.territories,
    status: o.status,
    createdAt: o.createdAt,
    expiresAt: o.expiresAt,
  };
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = req.query.status || "OPEN";
    const rows = await Opportunity.find({ status }).sort({ createdAt: -1 });
    ok(res, rows.map(serialize));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await Opportunity.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    ok(res, serialize(row));
  })
);

router.post(
  "/",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");

    const company = await getPharmaProfileByUserId(req.user.sub);
    const row = await Opportunity.create({ companyId: company.id, ...parsed.data });

    const matches = await matchForOpportunity(row._id);
    for (const match of matches.slice(0, 5)) {
      await createNotification({
        userId: match.userId,
        type: "OPPORTUNITY_MATCH",
        title: "New opportunity matches your profile",
        body: `${company.companyName} posted: ${parsed.data.title}`,
        data: { opportunityId: row._id, score: match.score, reasons: match.reasons },
      });
    }

    created(res, { opportunity: serialize(row), matchedCount: matches.length });
  })
);

router.patch(
  "/:id",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const row = await Opportunity.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    const company = await getPharmaProfileByUserId(req.user.sub);
    if (row.companyId.toString() !== company.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your opportunity");

    const { title, description, status } = req.body;
    if (title !== undefined) row.title = title;
    if (description !== undefined) row.description = description;
    if (status !== undefined) row.status = status;
    await row.save();
    ok(res, serialize(row));
  })
);

router.delete(
  "/:id",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const row = await Opportunity.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    const company = await getPharmaProfileByUserId(req.user.sub);
    if (row.companyId.toString() !== company.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your opportunity");
    await row.deleteOne();
    ok(res, { deleted: true });
  })
);

router.post(
  "/:id/apply",
  requireRole("MR", "INDEPENDENT_MR"),
  asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return fail(res, 404, "NOT_FOUND", "Opportunity not found");

    const existing = await OpportunityApplication.findOne({
      opportunityId: opportunity._id,
      applicantUserId: req.user.sub,
    });
    if (existing) return fail(res, 409, "ALREADY_APPLIED", "You already applied to this opportunity");

    const application = await OpportunityApplication.create({
      opportunityId: opportunity._id,
      applicantUserId: req.user.sub,
    });

    const company = await PharmaCompanyProfile.findById(opportunity.companyId);
    await createNotification({
      userId: company.userId,
      type: "OPPORTUNITY_MATCH",
      title: "New application received",
      body: `You have a new applicant for "${opportunity.title}"`,
      data: { opportunityId: opportunity._id, applicationId: application._id },
    });

    created(res, { applicationId: application._id });
  })
);

router.get(
  "/:id/applications",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    const company = await getPharmaProfileByUserId(req.user.sub);
    if (opportunity.companyId.toString() !== company.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your opportunity");

    const apps = await OpportunityApplication.find({ opportunityId: opportunity._id }).sort({ appliedAt: -1 });
    ok(
      res,
      apps.map((a) => ({
        id: a._id,
        applicantUserId: a.applicantUserId,
        status: a.status,
        appliedAt: a.appliedAt,
      }))
    );
  })
);

router.patch(
  "/:id/applications/:appId",
  requireRole("PHARMA_COMPANY"),
  asyncHandler(async (req, res) => {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    const company = await getPharmaProfileByUserId(req.user.sub);
    if (opportunity.companyId.toString() !== company.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your opportunity");

    const { status } = req.body;
    if (!["SHORTLISTED", "ACCEPTED", "REJECTED"].includes(status)) {
      return fail(res, 400, "VALIDATION_ERROR", "status must be SHORTLISTED, ACCEPTED, or REJECTED");
    }
    const application = await OpportunityApplication.findOneAndUpdate(
      { _id: req.params.appId, opportunityId: opportunity._id },
      { $set: { status } },
      { new: true }
    );
    if (application) {
      const applicant = await User.findById(application.applicantUserId);
      if (applicant) {
        await createNotification({
          userId: applicant._id,
          type: "OPPORTUNITY_MATCH",
          title: `Application ${status.toLowerCase()}`,
          body: `Your application for "${opportunity.title}" is now ${status.toLowerCase()}.`,
          data: { opportunityId: opportunity._id },
        });
      }
    }
    ok(res, { updated: true });
  })
);

module.exports = router;
