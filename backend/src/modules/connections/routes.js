const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ApiError, created, fail, ok } = require("../../common/http");
const Connection = require("../../models/Connection");
const User = require("../../models/User");
const DoctorProfile = require("../../models/DoctorProfile");
const { getDisplayProfile } = require("../profiles/service");
const { createNotification } = require("../notifications/service");
const { emitRealtime } = require("../../realtime/bus");

const router = express.Router();

router.use(requireAuth);

const CONNECTION_ROLES = {
  PHARMACY: [
    "PHARMA_COMPANY",
    "MR",
    "DISTRIBUTOR_STOCKIST",
  ],
  MR: [
    "PHARMACY",
    "PHARMA_COMPANY",
    "DISTRIBUTOR_STOCKIST",
    "DOCTOR",
  ],
  PHARMA_COMPANY: [
    "PHARMACY",
    "MR",
    "DISTRIBUTOR_STOCKIST",
    "DOCTOR",
  ],
  DISTRIBUTOR_STOCKIST: [
    "PHARMACY",
    "PHARMA_COMPANY",
    "MR",
  ],
};

function normalizeRole(role) {
  if (role === "STOCKIST" || role === "DISTRIBUTOR") {
    return "DISTRIBUTOR_STOCKIST";
  }

  return role;
}

async function enrich(c) {
  const requester = await User.findById(c.requesterId);
  const recipient = await User.findById(c.recipientId);

  return {
    id: c._id,
    status: c.status,
    message: c.message,
    createdAt: c.createdAt,
    respondedAt: c.respondedAt,
    requester: requester
      ? {
          userId: requester._id,
          ...(await getDisplayProfile(requester._id, requester.role)),
        }
      : null,
    recipient: recipient
      ? {
          userId: recipient._id,
          ...(await getDisplayProfile(recipient._id, recipient.role)),
        }
      : null,
  };
}

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { recipientId, message } = req.body;

    if (!recipientId) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "recipientId is required"
      );
    }

    const requesterUserId = String(req.user.sub);
    const recipientUserId = String(recipientId);

    // Prevent users from creating a connection with themselves.
    if (recipientUserId === requesterUserId) {
      return fail(
        res,
        400,
        "VALIDATION_ERROR",
        "Cannot connect with yourself"
      );
    }

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Recipient not found"
      );
    }
    if (recipient.status !== "ACTIVE") {
      return fail(
        res,
        403,
        "RECIPIENT_ACCOUNT_RESTRICTED",
        "Connection requests cannot be sent to an inactive account"
      );
    }

    const requesterRole = normalizeRole(req.user.role);
    const recipientRole = normalizeRole(recipient.role);
    const allowedRecipients = CONNECTION_ROLES[requesterRole] || [];

    if (!allowedRecipients.includes(recipientRole)) {
      return fail(
        res,
        403,
        "ROLE_CONNECTION_RESTRICTED",
        "This profile combination is not available for general connection requests"
      );
    }

    if (recipientRole === "DOCTOR") {
      const doctor = await DoctorProfile.findOne({
        userId: recipient._id,
      });
      const acceptsRequest =
        requesterRole === "MR"
          ? doctor?.acceptsMRRequests
          : doctor?.acceptsCompanyInformation;

      if (!doctor || !acceptsRequest) {
        return fail(
          res,
          403,
          "DOCTOR_NOT_ACCEPTING_REQUESTS",
          "This doctor is not accepting this type of professional request"
        );
      }

      return fail(
        res,
        403,
        "DOCTOR_CONNECTION_REQUIRES_APPOINTMENT",
        "Doctor contact must include a professional purpose and appointment request"
      );
    }

    const existing = await Connection.findOne({
      requesterId: req.user.sub,
      recipientId,
    });

    if (existing) {
      return fail(
        res,
        409,
        "ALREADY_EXISTS",
        "A connection request already exists"
      );
    }

    const row = await Connection.create({
      requesterId: req.user.sub,
      recipientId,
      message: message || "",
    });

    const requesterProfile = await getDisplayProfile(
      req.user.sub,
      req.user.role
    );

    const notification = await createNotification({
      userId: recipientId,
      type: "CONNECTION_REQUEST",
      title: "New connection request",
      body: `${requesterProfile.name} wants to connect with you.`,
      data: { connectionId: row._id },
    });

    emitRealtime({
      type: "connection:request",
      userId: recipientId.toString(),
      payload: notification,
    });

    created(res, await enrich(row));
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await Connection.find({
      $or: [
        { requesterId: req.user.sub },
        { recipientId: req.user.sub },
      ],
      status: "ACCEPTED",
    }).sort({ createdAt: -1 });

    ok(res, await Promise.all(rows.map(enrich)));
  })
);

router.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const rows = await Connection.find({
      recipientId: req.user.sub,
      status: "PENDING",
    }).sort({ createdAt: -1 });

    ok(res, await Promise.all(rows.map(enrich)));
  })
);

function respond(status) {
  return asyncHandler(async (req, res) => {
    const row = await Connection.findById(req.params.id);

    if (!row) {
      return fail(
        res,
        404,
        "NOT_FOUND",
        "Connection request not found"
      );
    }

    if (row.recipientId.toString() !== req.user.sub) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Not your connection request"
      );
    }

    if (row.status !== "PENDING") {
      return fail(
        res,
        409,
        "ALREADY_RESOLVED",
        "This request was already resolved"
      );
    }

    row.status = status;
    row.respondedAt = new Date();

    await row.save();

    if (status === "ACCEPTED") {
      const recipientProfile = await getDisplayProfile(
        req.user.sub,
        req.user.role
      );

      await createNotification({
        userId: row.requesterId,
        type: "CONNECTION_REQUEST",
        title: "Connection accepted",
        body: `${recipientProfile.name} accepted your connection request.`,
        data: { connectionId: row._id },
      });
    }

    ok(res, await enrich(row));
  });
}

router.patch("/:id/accept", respond("ACCEPTED"));
router.patch("/:id/decline", respond("DECLINED"));

module.exports = router;