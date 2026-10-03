const express = require("express");

const {
  asyncHandler,
  requireAuth,
  requireRole,
} = require("../../common/middleware");

const { ok } = require("../../common/http");

const {
  getPharmacyDashboard,
  getRoleDashboard,
} = require("./service");

const router = express.Router();

router.use(requireAuth);

/**
 * GET /api/v1/dashboard/pharmacy
 *
 * Pharmacy-only dashboard aggregation endpoint.
 */
router.get(
  "/pharmacy",
  requireRole("PHARMACY"),
  asyncHandler(async (req, res) => {
    const dashboard = await getPharmacyDashboard(
      req.user.sub
    );

    return ok(res, dashboard);
  })
);

router.get(
  "/workspace",
  requireRole(
    "MR",
    "PHARMA_COMPANY",
    "DISTRIBUTOR_STOCKIST",
    "DOCTOR"
  ),
  asyncHandler(async (req, res) => {
    const dashboard = await getRoleDashboard(
      req.user.sub,
      req.user.role
    );

    return ok(res, dashboard);
  })
);

module.exports = router;