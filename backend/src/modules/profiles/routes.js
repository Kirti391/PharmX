const express = require("express");
const { z } = require("zod");
const { asyncHandler, requireAuth, requireRole } = require("../../common/middleware");
const { ok, fail } = require("../../common/http");
const { upload, fileUrl } = require("../../common/upload");
const DoctorProfile = require("../../models/DoctorProfile");
const User = require("../../models/User");
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

// ---- Doctor ----
router.get("/doctor/me", asyncHandler(async (req, res) => ok(res, await profiles.getDoctorProfileByUserId(req.user.sub))));
router.patch("/doctor/me", asyncHandler(async (req, res) => ok(res, await profiles.updateDoctorProfile(req.user.sub, req.body))));
router.get(
  "/doctor/blocked-users",
  requireRole("DOCTOR"),
  asyncHandler(async (req, res) => {
    const profile = await DoctorProfile.findOne({
      userId: req.user.sub,
    });
    if (!profile) {
      return fail(res, 404, "NOT_FOUND", "Doctor profile not found");
    }

    const users = await User.find({
      _id: { $in: profile.blockedUserIds },
    }).select("_id role");
    ok(
      res,
      await Promise.all(
        users.map(async (user) => ({
          userId: user._id,
          ...(await profiles.getDisplayProfile(user._id, user.role)),
        }))
      )
    );
  })
);
router.post(
  "/doctor/blocked-users",
  requireRole("DOCTOR"),
  asyncHandler(async (req, res) => {
    const parsed = z
      .object({
        targetUserId: z.string().regex(/^[a-f\d]{24}$/i),
      })
      .safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "A valid targetUserId is required"
      );
    }
    if (parsed.data.targetUserId === req.user.sub) {
      return fail(res, 400, "VALIDATION_ERROR", "Cannot block yourself");
    }
    const [profile, target] = await Promise.all([
      DoctorProfile.findOne({ userId: req.user.sub }),
      User.findById(parsed.data.targetUserId).select("_id"),
    ]);
    if (!profile) {
      return fail(res, 404, "NOT_FOUND", "Doctor profile not found");
    }
    if (!target) {
      return fail(res, 404, "NOT_FOUND", "User not found");
    }

    await DoctorProfile.updateOne(
      { _id: profile._id },
      { $addToSet: { blockedUserIds: target._id } }
    );
    ok(res, { blocked: true });
  })
);
router.delete(
  "/doctor/blocked-users/:targetUserId",
  requireRole("DOCTOR"),
  asyncHandler(async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.targetUserId)) {
      return fail(res, 400, "VALIDATION_ERROR", "A valid user ID is required");
    }
    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: req.user.sub },
      { $pull: { blockedUserIds: req.params.targetUserId } },
      { new: true }
    );
    if (!profile) {
      return fail(res, 404, "NOT_FOUND", "Doctor profile not found");
    }
    ok(res, { blocked: false });
  })
);

module.exports = router;
