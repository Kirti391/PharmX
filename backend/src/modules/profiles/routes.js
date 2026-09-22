const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ok, fail } = require("../../common/http");
const { upload, fileUrl } = require("../../common/upload");
const profiles = require("./service");

const router = express.Router();
router.use(requireAuth);

router.post(
  "/upload-image",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) return fail(res, 400, "VALIDATION_ERROR", "No image file provided");
    ok(res, { url: fileUrl(req, req.file.filename) });
  })
);

// ---- MR ----
router.get("/mr/me", asyncHandler(async (req, res) => ok(res, await profiles.getMRProfileByUserId(req.user.sub))));
router.get("/mr/:id", asyncHandler(async (req, res) => ok(res, await profiles.getMRProfileById(req.params.id))));
router.patch("/mr/me", asyncHandler(async (req, res) => ok(res, await profiles.updateMRProfile(req.user.sub, req.body))));

// ---- Pharma Company ----
router.get("/pharma/me", asyncHandler(async (req, res) => ok(res, await profiles.getPharmaProfileByUserId(req.user.sub))));
router.get("/pharma/:id", asyncHandler(async (req, res) => ok(res, await profiles.getPharmaProfileById(req.params.id))));
router.patch("/pharma/me", asyncHandler(async (req, res) => ok(res, await profiles.updatePharmaProfile(req.user.sub, req.body))));

// ---- Pharmacy ----
router.get("/pharmacy/me", asyncHandler(async (req, res) => ok(res, await profiles.getPharmacyProfileByUserId(req.user.sub))));
router.get("/pharmacy/:id", asyncHandler(async (req, res) => ok(res, await profiles.getPharmacyProfileById(req.params.id))));
router.patch("/pharmacy/me", asyncHandler(async (req, res) => ok(res, await profiles.updatePharmacyProfile(req.user.sub, req.body))));

// ---- Stockist / Distributor ----
router.get("/stockist/me", asyncHandler(async (req, res) => ok(res, await profiles.getStockistProfileByUserId(req.user.sub))));
router.get("/stockist/:id", asyncHandler(async (req, res) => ok(res, await profiles.getStockistProfileById(req.params.id))));
router.patch("/stockist/me", asyncHandler(async (req, res) => ok(res, await profiles.updateStockistProfile(req.user.sub, req.body))));

module.exports = router;
