const express = require("express");
const { z } = require("zod");
const {
  asyncHandler,
  requireAuth,
  requireRole,
} = require("../../common/middleware");
const { created, fail, ok } = require("../../common/http");
const Appointment = require("../../models/Appointment");
const CompanyAuthorization = require("../../models/CompanyAuthorization");
const Connection = require("../../models/Connection");
const FollowUp = require("../../models/FollowUp");
const Lead = require("../../models/Lead");
const PharmaCompanyProfile = require("../../models/PharmaCompanyProfile");
const StockistProfile = require("../../models/StockistProfile");
const User = require("../../models/User");
const VerificationDocument = require("../../models/VerificationDocument");
const { recordAudit } = require("../../common/audit");
const { CLOSED_LEAD_STAGES, LEAD_STAGES } = require("../../common/constants");
const { getDisplayProfile } = require("../profiles/service");

const router = express.Router();
router.use(requireAuth);

const LEAD_ROLES = ["MR", "PHARMA_COMPANY", "DISTRIBUTOR_STOCKIST"];
const CLOSED_STAGES = new Set(CLOSED_LEAD_STAGES);

const createLeadSchema = z.object({
  targetUserId: z.string().regex(/^[a-f\d]{24}$/i),
  companyId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  appointmentId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  title: z.string().trim().min(3).max(160),
  source: z
    .enum(["MANUAL", "CONNECTION", "APPOINTMENT", "SEARCH"])
    .default("MANUAL"),
  category: z.string().trim().max(120).optional(),
  territory: z.string().trim().max(120).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  notes: z.string().trim().max(5000).optional(),
});

const stageSchema = z.object({
  stage: z.enum(LEAD_STAGES),
  reason: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

async function getRoleScope(user) {
  if (user.role === "PHARMA_COMPANY") {
    const company = await PharmaCompanyProfile.findOne({
      userId: user.sub,
      businessVerified: true,
      verificationStatus: "VERIFIED",
    }).select("_id userId");
    const currentRegistration = company
      ? await VerificationDocument.exists({
          userId: company.userId,
          docType: "BUSINESS_REG",
          status: "APPROVED",
          $or: [
            { expiryDate: null },
            { expiryDate: { $gt: new Date() } },
          ],
        })
      : false;
    if (!company || !currentRegistration) {
      return { error: "Verified company profile required" };
    }
    return { companyId: company._id };
  }
  if (user.role === "DISTRIBUTOR_STOCKIST") {
    const distributor = await StockistProfile.findOne({
      userId: user.sub,
      businessVerified: true,
    }).select("_id licenceExpiryDate");
    if (
      !distributor ||
      (distributor.licenceExpiryDate &&
        distributor.licenceExpiryDate <= new Date())
    ) {
      return { error: "Current verified distributor licence required" };
    }
    return { ownerUserId: user.sub };
  }
  if (user.role === "MR") {
    return { ownerUserId: user.sub };
  }
  return { error: "This account role cannot access lead management" };
}

function leadQueryFor(user, scope) {
  if (user.role === "PHARMA_COMPANY") {
    return { ownerCompanyId: scope.companyId };
  }
  return { createdBy: user.sub };
}

async function findAccessibleLead(user, id) {
  const scope = await getRoleScope(user);
  if (scope.error) {
    return { error: scope.error };
  }
  const lead = await Lead.findOne({
    _id: id,
    ...leadQueryFor(user, scope),
  });
  return lead ? { lead } : { error: "Lead not found" };
}

async function serializeLead(lead) {
  const [target, company] = await Promise.all([
    User.findById(lead.targetUserId).select("_id role"),
    lead.ownerCompanyId
      ? PharmaCompanyProfile.findById(lead.ownerCompanyId).select("companyName")
      : null,
  ]);
  return {
    id: lead._id,
    createdBy: lead.createdBy,
    ownerRole: lead.ownerRole,
    ownerCompanyId: lead.ownerCompanyId,
    ownerCompanyName: company?.companyName || null,
    targetUserId: lead.targetUserId,
    target: target
      ? {
          userId: target._id,
          ...(await getDisplayProfile(target._id, target.role)),
        }
      : null,
    appointmentId: lead.appointmentId,
    source: lead.source,
    title: lead.title,
    category: lead.category,
    territory: lead.territory,
    priority: lead.priority,
    stage: lead.stage,
    notes: lead.notes,
    closeReason: lead.closeReason,
    lastContactAt: lead.lastContactAt,
    nextFollowUpAt: lead.nextFollowUpAt,
    history: lead.history,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

router.get(
  "/",
  requireRole(...LEAD_ROLES),
  asyncHandler(async (req, res) => {
    const scope = await getRoleScope(req.user);
    if (scope.error) {
      return fail(res, 403, "LEAD_ACCESS_RESTRICTED", scope.error);
    }
    const query = leadQueryFor(req.user, scope);
    if (req.query.stage) {
      const stage = String(req.query.stage).toUpperCase();
      if (!LEAD_STAGES.includes(stage)) {
        return fail(res, 400, "VALIDATION_ERROR", "Invalid lead stage filter");
      }
      query.stage = stage;
    }
    if (req.query.priority) {
      const priority = String(req.query.priority).toUpperCase();
      if (!["LOW", "NORMAL", "HIGH"].includes(priority)) {
        return fail(
          res,
          400,
          "VALIDATION_ERROR",
          "Invalid lead priority filter"
        );
      }
      query.priority = priority;
    }
    const rows = await Lead.find(query).sort({ updatedAt: -1 }).limit(100);
    ok(res, await Promise.all(rows.map(serializeLead)));
  })
);

router.post(
  "/",
  requireRole(...LEAD_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = createLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid lead"
      );
    }
    const scope = await getRoleScope(req.user);
    if (scope.error) {
      return fail(res, 403, "LEAD_ACCESS_RESTRICTED", scope.error);
    }
    const target = await User.findOne({
      _id: parsed.data.targetUserId,
      status: "ACTIVE",
    }).select("_id role");
    if (!target) {
      return fail(res, 404, "NOT_FOUND", "Active lead contact not found");
    }
    if (target.role === "DOCTOR") {
      return fail(
        res,
        403,
        "DOCTOR_LEAD_RESTRICTED",
        "Doctors are excluded from commercial lead pipelines"
      );
    }
    const allowedTargetRoles = {
      MR: ["PHARMA_COMPANY", "PHARMACY", "DISTRIBUTOR_STOCKIST"],
      PHARMA_COMPANY: ["MR", "PHARMACY", "DISTRIBUTOR_STOCKIST"],
      DISTRIBUTOR_STOCKIST: ["PHARMA_COMPANY", "MR", "PHARMACY"],
    };
    if (!allowedTargetRoles[req.user.role]?.includes(target.role)) {
      return fail(
        res,
        403,
        "LEAD_TARGET_ROLE_NOT_ALLOWED",
        "This account type cannot create a commercial lead for that profile"
      );
    }
    if (target._id.toString() === req.user.sub) {
      return fail(res, 400, "VALIDATION_ERROR", "A lead cannot target yourself");
    }

    const connection = await Connection.exists({
      status: "ACCEPTED",
      $or: [
        {
          requesterId: req.user.sub,
          recipientId: target._id,
        },
        {
          requesterId: target._id,
          recipientId: req.user.sub,
        },
      ],
    });
    let appointment = null;
    if (parsed.data.appointmentId) {
      appointment = await Appointment.findOne({
        _id: parsed.data.appointmentId,
        requesterId: { $in: [req.user.sub, target._id] },
        recipientId: { $in: [req.user.sub, target._id] },
        status: { $in: ["CONFIRMED", "RUNNING_LATE", "COMPLETED"] },
      }).select("_id");
    }
    if (!connection && !appointment) {
      return fail(
        res,
        403,
        "ACCEPTED_RELATIONSHIP_REQUIRED",
        "Leads can be recorded only for accepted connections or appointments"
      );
    }

    let ownerCompanyId = scope.companyId || null;
    if (req.user.role === "MR") {
      if (!parsed.data.companyId) {
        return fail(
          res,
          400,
          "MR_AUTHORIZATION_REQUIRED",
          "Select the company authorization this lead belongs to"
        );
      }
      const authorization = await CompanyAuthorization.findOne({
        companyId: parsed.data.companyId,
        mrUserId: req.user.sub,
        status: "ACTIVE",
        expiresAt: { $gt: new Date() },
      });
      const currentAuthorizationDocument = authorization
        ? await VerificationDocument.exists({
            _id: authorization.verificationDocumentId,
            userId: req.user.sub,
            companyId: authorization.companyId,
            docType: "COMPANY_AUTHORIZATION",
            status: "APPROVED",
            $or: [
              { expiryDate: null },
              { expiryDate: { $gt: new Date() } },
            ],
          })
        : false;
      const authorizedCompany = authorization
        ? await PharmaCompanyProfile.findOne({
            _id: authorization.companyId,
            businessVerified: true,
            verificationStatus: "VERIFIED",
          }).select("_id userId")
        : null;
      const currentBusinessRegistration = authorizedCompany
        ? await VerificationDocument.exists({
            userId: authorizedCompany.userId,
            docType: "BUSINESS_REG",
            status: "APPROVED",
            $or: [
              { expiryDate: null },
              { expiryDate: { $gt: new Date() } },
            ],
          })
        : false;
      if (
        !authorization ||
        !currentAuthorizationDocument ||
        !authorizedCompany ||
        !currentBusinessRegistration
      ) {
        return fail(
          res,
          403,
          "MR_AUTHORIZATION_REQUIRED",
          "An active company authorization is required to create a company-scoped lead"
        );
      }
      const categoryAllowed =
        !parsed.data.category ||
        authorization.categories.some(
          (category) =>
            category.toLowerCase() === parsed.data.category.toLowerCase()
        );
      const territoryAllowed =
        !parsed.data.territory ||
        authorization.territories.some((territory) => {
          const scopeTerritory = territory.toLowerCase();
          const requestedTerritory = parsed.data.territory.toLowerCase();
          return (
            scopeTerritory.includes(requestedTerritory) ||
            requestedTerritory.includes(scopeTerritory)
          );
        });
      if (!categoryAllowed || !territoryAllowed) {
        return fail(
          res,
          403,
          "MR_AUTHORIZATION_SCOPE_MISMATCH",
          "The lead category and territory must be covered by your authorization"
        );
      }
      ownerCompanyId = authorization.companyId;
    }

    const lead = await Lead.create({
      createdBy: req.user.sub,
      ownerRole: req.user.role,
      ownerCompanyId,
      targetUserId: target._id,
      appointmentId: appointment?._id || null,
      source: parsed.data.source,
      title: parsed.data.title,
      category: parsed.data.category || "",
      territory: parsed.data.territory || "",
      priority: parsed.data.priority,
      notes: parsed.data.notes || "",
      history: [
        {
          fromStage: null,
          toStage: "NEW",
          actorId: req.user.sub,
          reason: "Lead created",
        },
      ],
    });
    await recordAudit({
      userId: req.user.sub,
      action: "LEAD_CREATED",
      targetType: "Lead",
      targetId: lead._id.toString(),
      metadata: { source: lead.source, ownerCompanyId },
    });
    created(res, await serializeLead(lead));
  })
);

router.patch(
  "/:id/stage",
  requireRole(...LEAD_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = stageSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid lead stage"
      );
    }
    if (
      CLOSED_STAGES.has(parsed.data.stage) &&
      !parsed.data.reason?.trim()
    ) {
      return fail(
        res,
        400,
        "CLOSE_REASON_REQUIRED",
        "A closure reason is required for a terminal lead stage"
      );
    }
    const dueAt = new Date(parsed.data.dueAt);
    if (dueAt <= new Date()) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "Follow-up due date must be in the future"
      );
    }
    const result = await findAccessibleLead(req.user, req.params.id);
    if (!result.lead) {
      return fail(
        res,
        result.error === "Lead not found" ? 404 : 403,
        result.error === "Lead not found" ? "NOT_FOUND" : "LEAD_ACCESS_RESTRICTED",
        result.error
      );
    }
    const lead = result.lead;
    if (CLOSED_STAGES.has(lead.stage)) {
      return fail(
        res,
        409,
        "LEAD_CLOSED",
        "Closed leads cannot be changed. Create a new lead to restart the relationship."
      );
    }
    const fromStage = lead.stage;
    lead.stage = parsed.data.stage;
    lead.closeReason = CLOSED_STAGES.has(lead.stage)
      ? parsed.data.reason.trim()
      : "";
    if (parsed.data.notes) lead.notes = parsed.data.notes;
    if (lead.stage === "APPOINTMENT_COMPLETED") {
      lead.lastContactAt = new Date();
    }
    lead.history.push({
      fromStage,
      toStage: lead.stage,
      actorId: req.user.sub,
      reason: parsed.data.reason || "",
      notes: parsed.data.notes || "",
    });
    await lead.save();
    await recordAudit({
      userId: req.user.sub,
      action: "LEAD_STAGE_CHANGED",
      targetType: "Lead",
      targetId: lead._id.toString(),
      metadata: { fromStage, toStage: lead.stage },
    });
    ok(res, await serializeLead(lead));
  })
);

router.get(
  "/follow-ups",
  requireRole(...LEAD_ROLES),
  asyncHandler(async (req, res) => {
    const status = req.query.status || "PENDING";
    if (!["PENDING", "COMPLETED", "CANCELLED"].includes(String(status))) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "Follow-up status must be PENDING, COMPLETED, or CANCELLED"
      );
    }
    const followUpQuery = {
      ownerUserId: req.user.sub,
      status,
    };
    const rows = await FollowUp.find(followUpQuery)
      .sort({ dueAt: 1 })
      .limit(100);
    const scope = await getRoleScope(req.user);
    if (scope.error) {
      return fail(res, 403, "LEAD_ACCESS_RESTRICTED", scope.error);
    }
    const visibleLeads = await Lead.find({
      ...leadQueryFor(req.user, scope),
      _id: { $in: rows.map((followUp) => followUp.leadId) },
    }).select("_id title");
    const leadTitles = new Map(
      visibleLeads.map((lead) => [lead._id.toString(), lead.title])
    );
    ok(
      res,
      rows
        .filter((followUp) => leadTitles.has(followUp.leadId.toString()))
        .map((followUp) => ({
          id: followUp._id,
          leadId: followUp.leadId,
          leadTitle: leadTitles.get(followUp.leadId.toString()),
          dueAt: followUp.dueAt,
          status: followUp.status,
          notes: followUp.notes,
          completedAt: followUp.completedAt,
        }))
    );
  })
);

router.post(
  "/:id/follow-ups",
  requireRole(...LEAD_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        dueAt: z.string().datetime(),
        notes: z.string().trim().max(2000).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid follow-up"
      );
    }
    const result = await findAccessibleLead(req.user, req.params.id);
    if (!result.lead) {
      return fail(
        res,
        result.error === "Lead not found" ? 404 : 403,
        result.error === "Lead not found" ? "NOT_FOUND" : "LEAD_ACCESS_RESTRICTED",
        result.error
      );
    }
    if (CLOSED_STAGES.has(result.lead.stage)) {
      return fail(
        res,
        409,
        "LEAD_CLOSED",
        "A follow-up cannot be added to a closed lead"
      );
    }

    const followUp = await FollowUp.create({
      leadId: result.lead._id,
      ownerUserId: req.user.sub,
      createdBy: req.user.sub,
      dueAt,
      notes: parsed.data.notes || "",
    });
    const next = await FollowUp.findOne({
      leadId: result.lead._id,
      ownerUserId: req.user.sub,
      status: "PENDING",
    }).sort({ dueAt: 1 });
    result.lead.nextFollowUpAt = next?.dueAt || null;
    if (result.lead.stage !== "FOLLOW_UP") {
      const fromStage = result.lead.stage;
      result.lead.stage = "FOLLOW_UP";
      result.lead.history.push({
        fromStage,
        toStage: "FOLLOW_UP",
        actorId: req.user.sub,
        reason: "Follow-up scheduled",
      });
    }
    await result.lead.save();
    await recordAudit({
      userId: req.user.sub,
      action: "LEAD_FOLLOW_UP_CREATED",
      targetType: "FollowUp",
      targetId: followUp._id.toString(),
      metadata: { leadId: result.lead._id },
    });
    created(res, {
      id: followUp._id,
      leadId: followUp.leadId,
      dueAt: followUp.dueAt,
      status: followUp.status,
      notes: followUp.notes,
    });
  })
);

router.patch(
  "/follow-ups/:id",
  requireRole(...LEAD_ROLES),
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        status: z.enum(["COMPLETED", "CANCELLED"]),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid follow-up status"
      );
    }
    const followUp = await FollowUp.findOne({
      _id: req.params.id,
      ownerUserId: req.user.sub,
      status: "PENDING",
    });
    if (!followUp) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Pending follow-up not found"
      );
    }
    const access = await findAccessibleLead(req.user, followUp.leadId);
    if (!access.lead) {
      return fail(
        res,
        access.error === "Lead not found" ? 404 : 403,
        access.error === "Lead not found" ? "NOT_FOUND" : "LEAD_ACCESS_RESTRICTED",
        access.error
      );
    }
    followUp.status = parsed.data.status;
    followUp.completedAt =
      parsed.data.status === "COMPLETED" ? new Date() : null;
    await followUp.save();
    if (parsed.data.status === "COMPLETED") {
      access.lead.lastContactAt = followUp.completedAt;
    }

    const next = await FollowUp.findOne({
      leadId: followUp.leadId,
      ownerUserId: req.user.sub,
      status: "PENDING",
    }).sort({ dueAt: 1 });
    access.lead.nextFollowUpAt = next?.dueAt || null;
    await access.lead.save();
    await recordAudit({
      userId: req.user.sub,
      action: `LEAD_FOLLOW_UP_${parsed.data.status}`,
      targetType: "FollowUp",
      targetId: followUp._id.toString(),
      metadata: { leadId: followUp.leadId },
    });
    ok(res, {
      id: followUp._id,
      leadId: followUp.leadId,
      dueAt: followUp.dueAt,
      status: followUp.status,
      completedAt: followUp.completedAt,
    });
  })
);

module.exports = router;
