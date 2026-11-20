const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth, requireRole } = require("../../common/middleware");
const { created, fail, ok, ApiError } = require("../../common/http");
const Opportunity = require("../../models/Opportunity");
const OpportunityApplication = require("../../models/OpportunityApplication");
const MRProfile = require("../../models/MRProfile");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const User = require("../../models/User");
const { getPharmaProfileByUserId } = require("../profiles/service");
const { matchForOpportunity } = require("../matching/service");
const { createNotification } = require("../notifications/service");

const router = express.Router();
router.use(requireAuth);

const createSchema = z.object({
  type: z.enum(["MR_HIRING", "TERRITORY_EXPANSION", "DISTRIBUTION", "PRODUCT_PROMOTION"]),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(5).max(10000),
  categories: z.array(z.string().trim().min(1)).default([]),
  territories: z.array(z.string().trim().min(1)).default([]),
  expiresAt: z.string().datetime().optional(),
});

const updateSchema = z
  .object({
    type: z.enum(["MR_HIRING", "TERRITORY_EXPANSION", "DISTRIBUTION", "PRODUCT_PROMOTION"]).optional(),
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(5).max(10000).optional(),
    categories: z.array(z.string().trim().min(1)).optional(),
    territories: z.array(z.string().trim().min(1)).optional(),
    status: z.enum(["OPEN", "CLOSED", "FILLED"]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

const applySchema = z.object({
  message: z.string().trim().max(2000).optional().default(""),
  shareContactDetails: z.literal(true),
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

async function serializeForApplicant(opportunities, user) {
  const rows = opportunities.map(serialize);
  if (!["MR", "INDEPENDENT_MR"].includes(user.role) || rows.length === 0) {
    return rows;
  }

  const applications = await OpportunityApplication.find({
    applicantUserId: user.sub,
    opportunityId: { $in: opportunities.map((opportunity) => opportunity._id) },
  }).select("opportunityId status");
  const applicationsByOpportunity = new Map(
    applications.map((application) => [
      application.opportunityId.toString(),
      application.status,
    ])
  );

  return rows.map((opportunity) => ({
    ...opportunity,
    applicationStatus:
      applicationsByOpportunity.get(opportunity.id.toString()) || null,
  }));
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = String(req.query.status || "OPEN").toUpperCase();
    const filter = {};

    if (status !== "ALL") {
      filter.status = status;
    } else if (req.user.role !== "PHARMA_COMPANY") {
      filter.status = "OPEN";
    }

    if (req.user.role === "PHARMA_COMPANY") {
      const company = await getPharmaProfileByUserId(req.user.sub);
      filter.companyId = company.id;
    }

    const rows = await Opportunity.find(filter).sort({ createdAt: -1 });
    const opportunities = await serializeForApplicant(rows, req.user);
    ok(
      res,
      req.user.role === "PHARMA_COMPANY"
        ? opportunities.map((opportunity) => ({
            ...opportunity,
            isOwner: true,
          }))
        : opportunities
    );
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await Opportunity.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    const opportunity = serialize(row);
    if (req.user.role === "PHARMA_COMPANY") {
      const company = await getPharmaProfileByUserId(req.user.sub);
      opportunity.isOwner =
        row.companyId.toString() === company.id.toString();
    }
    if (["MR", "INDEPENDENT_MR"].includes(req.user.role)) {
      const application = await OpportunityApplication.findOne({
        opportunityId: row._id,
        applicantUserId: req.user.sub,
      }).select("status");
      opportunity.applicationStatus = application?.status || null;
    }
    ok(res, opportunity);
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
    const company = await getPharmaProfileByUserId(req.user.sub);
    const row = await Opportunity.findById(req.params.id);
    if (!row) return fail(res, 404, "NOT_FOUND", "Opportunity not found");
    if (row.companyId.toString() !== company.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your opportunity");

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid opportunity update"
      );
    }
    Object.assign(row, parsed.data);
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
    await OpportunityApplication.deleteMany({ opportunityId: row._id });
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
    if (opportunity.status !== "OPEN") {
      return fail(res, 409, "OPPORTUNITY_CLOSED", "This opportunity is no longer open");
    }

    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid application"
      );
    }

    const existing = await OpportunityApplication.findOne({
      opportunityId: opportunity._id,
      applicantUserId: req.user.sub,
    });
    if (existing) return fail(res, 409, "ALREADY_APPLIED", "You already applied to this opportunity");

    const [applicant, applicantProfile] = await Promise.all([
      User.findById(req.user.sub).select("email mobile"),
      MRProfile.findOne({ userId: req.user.sub }),
    ]);
    if (!applicantProfile) {
      return fail(
        res,
        400,
        "PROFILE_REQUIRED",
        "Complete your MR profile before applying."
      );
    }

    const application = await OpportunityApplication.create({
      opportunityId: opportunity._id,
      applicantUserId: req.user.sub,
      message: parsed.data.message,
      applicantProfile: {
        fullName: applicantProfile.fullName,
        profileImageUrl: applicantProfile.profileImageUrl,
        experienceYears: applicantProfile.experienceYears,
        bio: applicantProfile.bio,
        languages: applicantProfile.languages,
        specializations: applicantProfile.specializations,
        territories: applicantProfile.territories,
        workMode: applicantProfile.workMode,
        availabilityStatus: applicantProfile.availabilityStatus,
        preferredOpportunityTypes: applicantProfile.preferredOpportunityTypes,
        email: applicant?.email || "",
        mobile: applicant?.mobile || "",
      },
    });

    const company = await PharmaCompanyProfile.findById(opportunity.companyId);
    await createNotification({
      userId: company.userId,
      type: "OPPORTUNITY_MATCH",
      title: "New application received",
      body: `You have a new applicant for "${opportunity.title}"`,
      data: { opportunityId: opportunity._id, applicationId: application._id },
    });

    created(res, { applicationId: application._id, status: application.status });
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
    const applicantIds = [...new Set(apps.map((application) => application.applicantUserId.toString()))];
    const [applicantUsers, applicantProfiles] = await Promise.all([
      User.find({ _id: { $in: applicantIds } }).select("email mobile"),
      MRProfile.find({ userId: { $in: applicantIds } }),
    ]);
    const usersById = new Map(
      applicantUsers.map((applicant) => [applicant._id.toString(), applicant])
    );
    const profilesByUserId = new Map(
      applicantProfiles.map((profile) => [profile.userId.toString(), profile])
    );
    ok(
      res,
      apps.map((application) => {
        const applicantUserId = application.applicantUserId.toString();
        const profile = profilesByUserId.get(applicantUserId);
        const account = usersById.get(applicantUserId);
        const snapshot = application.applicantProfile?.toObject
          ? application.applicantProfile.toObject()
          : application.applicantProfile || {};

        return {
          id: application._id,
          applicantUserId: application.applicantUserId,
          status: application.status,
          appliedAt: application.appliedAt,
          message: application.message || "",
          applicant: {
            fullName:
              snapshot.fullName || profile?.fullName || "Medical representative",
            profileImageUrl:
              snapshot.profileImageUrl || profile?.profileImageUrl || null,
            experienceYears:
              snapshot.experienceYears ?? profile?.experienceYears ?? 0,
            bio: snapshot.bio || profile?.bio || "",
            languages: snapshot.languages?.length
              ? snapshot.languages
              : profile?.languages || [],
            specializations: snapshot.specializations?.length
              ? snapshot.specializations
              : profile?.specializations || [],
            territories: snapshot.territories?.length
              ? snapshot.territories
              : profile?.territories || [],
            workMode: snapshot.workMode || profile?.workMode || "",
            availabilityStatus:
              snapshot.availabilityStatus || profile?.availabilityStatus || "",
            preferredOpportunityTypes: snapshot.preferredOpportunityTypes?.length
              ? snapshot.preferredOpportunityTypes
              : profile?.preferredOpportunityTypes || [],
            email: snapshot.email || account?.email || "",
            mobile: snapshot.mobile || account?.mobile || "",
          },
        };
      })
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
