const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { created, fail } = require("../../common/http");
const Report = require("../../models/Report");

const router = express.Router();
router.use(requireAuth);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { targetUserId, reason, details } = req.body;
    if (!targetUserId || !reason) {
      return fail(res, 400, "VALIDATION_ERROR", "targetUserId and reason are required");
    }
    const row = await Report.create({
      reporterId: req.user.sub,
      targetUserId,
      reason,
      details: details || "",
    });
    created(res, { reportId: row._id });
  })
);

module.exports = router;
