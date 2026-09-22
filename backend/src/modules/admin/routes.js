const express = require("express");
const { asyncHandler, requireAuth, requireRole } = require("../../common/middleware");
const { fail, ok } = require("../../common/http");
const User = require("../../models/User");
const PharmacyProfile = require("../../models/PharmacyProfile");
const StockistProfile = require("../../models/StockistProfile");
const VerificationDocument = require("../../models/VerificationDocument");
const Report = require("../../models/Report");
const AuditLog = require("../../models/AuditLog");
const Requirement = require("../../models/Requirement");
const Opportunity = require("../../models/Opportunity");
const Appointment = require("../../models/Appointment");
const Message = require("../../models/Message");
const { recordAudit } = require("../../common/audit");
const { createNotification } = require("../notifications/service");
const { PRODUCT_CATEGORIES } = require("../../common/constants");

function publicUser(u) {
  return {
    id: u._id,
    email: u.email,
    mobile: u.mobile,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.role) query.role = req.query.role;
    const rows = await User.find(query).sort({ createdAt: -1 });
    ok(res, rows.map(publicUser));
  })
);

router.patch(
  "/users/:id/verify",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");

    user.status = "ACTIVE";
    await user.save();
    // Also flip the business-verified badge on whichever profile they hold (harmless no-op
    // on the one that doesn't match).
    await PharmacyProfile.updateOne({ userId: user._id }, { $set: { businessVerified: true } });
    await StockistProfile.updateOne({ userId: user._id }, { $set: { businessVerified: true } });
    await VerificationDocument.updateMany(
      { userId: user._id, status: "PENDING" },
      { $set: { status: "APPROVED", reviewedBy: req.user.sub, reviewedAt: new Date() } }
    );

    await recordAudit({ userId: req.user.sub, action: "ADMIN_VERIFIED_USER", targetType: "User", targetId: user._id.toString() });
    await createNotification({
      userId: user._id,
      type: "VERIFICATION_UPDATE",
      title: "Account verified",
      body: "Your account has been verified and your dashboard is fully unlocked.",
    });
    ok(res, publicUser(user));
  })
);

router.patch(
  "/users/:id/reject",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");
    const { reason } = req.body;

    user.status = "REJECTED";
    await user.save();
    await VerificationDocument.updateMany(
      { userId: user._id, status: "PENDING" },
      {
        $set: {
          status: "REJECTED",
          reviewedBy: req.user.sub,
          reviewedAt: new Date(),
          rejectionReason: reason || "Did not meet verification requirements",
        },
      }
    );

    await recordAudit({
      userId: req.user.sub,
      action: "ADMIN_REJECTED_USER",
      targetType: "User",
      targetId: user._id.toString(),
      metadata: { reason },
    });
    await createNotification({
      userId: user._id,
      type: "VERIFICATION_UPDATE",
      title: "Verification rejected",
      body: reason || "Your verification was rejected. Please resubmit your documents.",
    });
    ok(res, publicUser(user));
  })
);

router.patch(
  "/users/:id/suspend",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "NOT_FOUND", "User not found");

    user.status = "SUSPENDED";
    await user.save();
    await recordAudit({ userId: req.user.sub, action: "ADMIN_SUSPENDED_USER", targetType: "User", targetId: user._id.toString() });
    await createNotification({
      userId: user._id,
      type: "SYSTEM",
      title: "Account suspended",
      body: "Your account has been suspended by an administrator.",
    });
    ok(res, publicUser(user));
  })
);

router.get(
  "/verifications",
  asyncHandler(async (req, res) => {
    const status = req.query.status || "PENDING";
    const rows = await VerificationDocument.find({ status }).sort({ createdAt: -1 });
    ok(
      res,
      rows.map((r) => ({
        id: r._id,
        userId: r.userId,
        docType: r.docType,
        fileUrl: r.fileUrl,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  })
);

router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const rows = await Report.find().sort({ createdAt: -1 });
    ok(
      res,
      rows.map((r) => ({
        id: r._id,
        reporterId: r.reporterId,
        targetUserId: r.targetUserId,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
      }))
    );
  })
);

router.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
    ok(res, rows);
  })
);

router.get(
  "/analytics/overview",
  asyncHandler(async (req, res) => {
    async function countBy(Model, field) {
      const rows = await Model.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
      return rows.map((r) => ({ [field]: r._id, count: r.count }));
    }

    const [usersByRole, usersByStatus, requirementsByStatus, opportunitiesByStatus, appointmentsByStatus, totalMessages] =
      await Promise.all([
        countBy(User, "role"),
        countBy(User, "status"),
        countBy(Requirement, "status"),
        countBy(Opportunity, "status"),
        countBy(Appointment, "status"),
        Message.countDocuments(),
      ]);

    ok(res, { usersByRole, usersByStatus, requirementsByStatus, opportunitiesByStatus, appointmentsByStatus, totalMessages });
  })
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => ok(res, PRODUCT_CATEGORIES))
);

module.exports = router;
