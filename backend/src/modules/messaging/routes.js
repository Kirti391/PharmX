const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ApiError, created, fail, ok } = require("../../common/http");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const Appointment = require("../../models/Appointment");
const Connection = require("../../models/Connection");
const DoctorProfile = require("../../models/DoctorProfile");
const User = require("../../models/User");
const { getDisplayProfile } = require("../profiles/service");
const { createNotification } = require("../notifications/service");
const { emitRealtime } = require("../../realtime/bus");

const router = express.Router();
router.use(requireAuth);

async function canMessage(userIds) {
  const users = await User.find({
    _id: { $in: userIds },
  }).select("_id role status");
  if (
    users.length !== userIds.length ||
    users.some((user) => user.status !== "ACTIVE")
  ) {
    return false;
  }
  const doctor = users.find((user) => user.role === "DOCTOR");

  if (doctor) {
    const doctorProfile = await DoctorProfile.findOne({
      userId: doctor._id,
    }).select("blockedUserIds");
    const otherUserId = userIds.find(
      (userId) => userId !== doctor._id.toString()
    );
    const blocked = doctorProfile?.blockedUserIds?.some(
      (blockedUserId) => blockedUserId.toString() === otherUserId
    );
    const acceptedAppointment = await Appointment.exists({
      requesterId: { $in: userIds },
      recipientId: { $in: userIds },
      status: { $in: ["CONFIRMED", "RUNNING_LATE", "COMPLETED"] },
    });

    return (
      Boolean(doctorProfile) &&
      !blocked &&
      Boolean(acceptedAppointment)
    );
  }

  const acceptedConnection = await Connection.exists({
    status: "ACCEPTED",
    $or: [
      {
        requesterId: userIds[0],
        recipientId: userIds[1],
      },
      {
        requesterId: userIds[1],
        recipientId: userIds[0],
      },
    ],
  });

  return Boolean(acceptedConnection);
}

async function assertMessagingPermission(userIds) {
  if (await canMessage(userIds)) return;

  const users = await User.find({
    _id: { $in: userIds },
  }).select("role");
  const involvesDoctor = users.some((user) => user.role === "DOCTOR");

  throw new ApiError(
    403,
    involvesDoctor
      ? "DOCTOR_CONSENT_REQUIRED"
      : "ACCEPTED_CONNECTION_REQUIRED",
    involvesDoctor
      ? "Doctor messaging is available only after an accepted professional appointment and may be blocked by the doctor"
      : "Messaging requires an accepted connection"
  );
}

async function serializeConversation(c, currentUserId) {
  const otherId = c.participantIds.find((id) => id.toString() !== currentUserId) || c.participantIds[0];
  const other = otherId ? await User.findById(otherId) : null;
  return {
    id: c._id,
    participantIds: c.participantIds,
    otherParticipant: other ? { userId: other._id, ...(await getDisplayProfile(other._id, other.role)) } : null,
    lastMessageAt: c.lastMessageAt,
    createdAt: c.createdAt,
  };
}

function serializeMessage(m) {
  return {
    id: m._id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    body: m.body,
    attachmentUrl: m.attachmentUrl,
    readAt: m.readAt,
    createdAt: m.createdAt,
  };
}

router.get(
  "/conversations",
  asyncHandler(async (req, res) => {
    const rows = await Conversation.find({ participantIds: req.user.sub }).sort({ lastMessageAt: -1 });
    const permittedRows = [];
    for (const conversation of rows) {
      const participantIds = conversation.participantIds.map((id) =>
        id.toString()
      );
      if (await canMessage(participantIds)) {
        permittedRows.push(conversation);
      }
    }
    ok(
      res,
      await Promise.all(
        permittedRows.map((conversation) =>
          serializeConversation(conversation, req.user.sub)
        )
      )
    );
  })
);

router.post(
  "/conversations",
  asyncHandler(async (req, res) => {
    const { participantId } = req.body;
    if (!participantId) return fail(res, 400, "VALIDATION_ERROR", "participantId is required");
    if (participantId === req.user.sub) return fail(res, 400, "VALIDATION_ERROR", "Cannot message yourself");
    const other = await User.findById(participantId);
    if (!other) return fail(res, 404, "NOT_FOUND", "Participant not found");

    await assertMessagingPermission([
      req.user.sub,
      other._id.toString(),
    ]);

    let convo = await Conversation.findOne({
      participantIds: { $all: [req.user.sub, participantId], $size: 2 },
    });
    if (convo) return ok(res, await serializeConversation(convo, req.user.sub));

    convo = await Conversation.create({ participantIds: [req.user.sub, participantId] });
    created(res, await serializeConversation(convo, req.user.sub));
  })
);

function assertParticipant(conversation, userId) {
  const ids = conversation.participantIds.map((id) => id.toString());
  if (!ids.includes(userId)) throw new ApiError(403, "FORBIDDEN", "Not part of this conversation");
  return ids;
}

router.get(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return fail(res, 404, "NOT_FOUND", "Conversation not found");
    const participantIds = assertParticipant(
      conversation,
      req.user.sub
    );
    await assertMessagingPermission(participantIds);

    const cursor = req.query.cursor;
    const query = { conversationId: conversation._id };
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const rows = await Message.find(query).sort({ createdAt: -1 }).limit(50);
    ok(res, rows.map(serializeMessage).reverse());
  })
);

router.post(
  "/conversations/:id/messages",
  asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return fail(res, 404, "NOT_FOUND", "Conversation not found");
    const participantIds = assertParticipant(conversation, req.user.sub);
    await assertMessagingPermission(participantIds);

    const { body, attachmentUrl } = req.body;
    if (!body || !body.trim()) return fail(res, 400, "VALIDATION_ERROR", "Message body is required");

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user.sub,
      body: body.trim(),
      attachmentUrl: attachmentUrl || null,
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const serialized = serializeMessage(message);
    const recipients = participantIds.filter((id) => id !== req.user.sub);
    const senderProfile = await getDisplayProfile(req.user.sub, req.user.role);
    for (const recipientId of recipients) {
      await createNotification({
        userId: recipientId,
        type: "MESSAGE",
        title: `New message from ${senderProfile.name}`,
        body: body.length > 80 ? body.slice(0, 80) + "…" : body,
        data: { conversationId: conversation._id },
      });
    }
    emitRealtime({ type: "message:new", userIds: participantIds, payload: serialized });

    created(res, serialized);
  })
);

module.exports = router;
