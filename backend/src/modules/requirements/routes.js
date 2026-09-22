const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth, requireRole } = require("../../common/middleware");
const { created, fail, ok, ApiError } = require("../../common/http");
const Requirement = require("../../models/Requirement");
const { getPharmacyProfileByUserId } = require("../profiles/service");
const { matchForRequirement } = require("../matching/service");
const { createNotification } = require("../notifications/service");

const router = express.Router();
router.use(requireAuth);

const createSchema = z.object({
  category: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(5),
  urgency: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
});

function serialize(r) {
  return {
    id: r._id,
    pharmacyId: r.pharmacyId,
    category: r.category,
    title: r.title,
    description: r.description,
    urgency: r.urgency,
    status: r.status,
    createdAt: r.createdAt,
  };
}

router.get("/", asyncHandler(async (req, res) => {
  const status = req.query.status || "OPEN";
  const rows = await Requirement.find({ status }).sort({ createdAt: -1 });
  ok(res, rows.map(serialize));
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const row = await Requirement.findById(req.params.id);
  if (!row) return fail(res, 404, "NOT_FOUND", "Requirement not found");
  ok(res, serialize(row));
}));

router.post("/", requireRole("PHARMACY"), asyncHandler(async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input");

  const pharmacy = await getPharmacyProfileByUserId(req.user.sub);
  const row = await Requirement.create({ pharmacyId: pharmacy.id, ...parsed.data });

  // Matching + notification fan-out runs inline here (fine at MVP scale — see docs for the
  // background-queue plan once profile volume grows).
  const matches = await matchForRequirement(row._id);
  for (const match of matches.slice(0, 5)) {
    await createNotification({
      userId: match.userId,
      type: "REQUIREMENT_MATCH",
      title: "New pharmacy requirement matches your profile",
      body: `${pharmacy.pharmacyName} is looking for ${parsed.data.category} products/services.`,
      data: { requirementId: row._id, score: match.score, reasons: match.reasons },
    });
  }

  created(res, { requirement: serialize(row), matchedCount: matches.length });
}));

router.patch("/:id", requireRole("PHARMACY"), asyncHandler(async (req, res) => {
  const row = await Requirement.findById(req.params.id);
  if (!row) return fail(res, 404, "NOT_FOUND", "Requirement not found");
  const pharmacy = await getPharmacyProfileByUserId(req.user.sub);
  if (row.pharmacyId.toString() !== pharmacy.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your requirement");

  const { title, description, urgency, status } = req.body;
  if (title !== undefined) row.title = title;
  if (description !== undefined) row.description = description;
  if (urgency !== undefined) row.urgency = urgency;
  if (status !== undefined) row.status = status;
  await row.save();
  ok(res, serialize(row));
}));

router.delete("/:id", requireRole("PHARMACY"), asyncHandler(async (req, res) => {
  const row = await Requirement.findById(req.params.id);
  if (!row) return fail(res, 404, "NOT_FOUND", "Requirement not found");
  const pharmacy = await getPharmacyProfileByUserId(req.user.sub);
  if (row.pharmacyId.toString() !== pharmacy.id.toString()) throw new ApiError(403, "FORBIDDEN", "Not your requirement");
  await row.deleteOne();
  ok(res, { deleted: true });
}));

module.exports = router;
