const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ok } = require("../../common/http");
const { listNotifications, markRead, markAllRead } = require("./service");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    ok(res, await listNotifications(req.user.sub));
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    await markRead(req.user.sub, req.params.id);
    ok(res, { readId: req.params.id });
  })
);

router.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    await markAllRead(req.user.sub);
    ok(res, { done: true });
  })
);

module.exports = router;
