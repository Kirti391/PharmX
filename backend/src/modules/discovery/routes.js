const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ok } = require("../../common/http");
const { listMRs, listPharmaCompanies, listPharmacies, listStockists } = require("../profiles/service");

const router = express.Router();
router.use(requireAuth);

router.get("/companies", asyncHandler(async (req, res) => {
  ok(res, await listPharmaCompanies({ territory: req.query.territory, category: req.query.category }));
}));

router.get("/mrs", asyncHandler(async (req, res) => {
  ok(res, await listMRs({
    territory: req.query.territory,
    specialization: req.query.specialization,
    workMode: req.query.workMode,
  }));
}));

router.get("/pharmacies", asyncHandler(async (req, res) => {
  ok(res, await listPharmacies({ territory: req.query.territory, category: req.query.category }));
}));

router.get("/stockists", asyncHandler(async (req, res) => {
  ok(res, await listStockists({
    territory: req.query.territory,
    category: req.query.category,
    type: req.query.type,
  }));
}));

module.exports = router;
