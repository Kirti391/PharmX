const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { created, fail } = require("../../common/http");
const Report = require("../../models/Report");
const User = require("../../models/User");

const router = express.Router();
router.use(requireAuth);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        targetUserId: z.string().regex(/^[a-f\d]{24}$/i),
        reason: z.enum([
          "HARASSMENT",
          "FRAUD",
          "UNSAFE_CONDUCT",
          "SPAM",
          "PRIVACY",
          "OTHER",
        ]),
        details: z.string().trim().max(1000).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid report"
      );
    }
    if (parsed.data.targetUserId === req.user.sub) {
      return fail(res, 400, "VALIDATION_ERROR", "Cannot report yourself");
    }
    const target = await User.findById(parsed.data.targetUserId).select("_id");
    if (!target) {
      return fail(res, 404, "NOT_FOUND", "Reported user not found");
    }

    const row = await Report.create({
      reporterId: req.user.sub,
      targetUserId: target._id,
      reason: parsed.data.reason,
      details: parsed.data.details || "",
    });
    created(res, { reportId: row._id });
  })
);

module.exports = router;
