const express = require("express");
const { asyncHandler, requireAuth } = require("../../common/middleware");
const { ApiError, created, fail, ok } = require("../../common/http");
const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");
const User = require("../../models/User");
const { getDisplayProfile } = require("../profiles/service");
const { createNotification } = require("../notifications/service");
const { emitRealtime } = require("../../realtime/bus");

const router = express.Router();
router.use(requireAuth);

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
    ok(res, await Promise.all(rows.map((c) => serializeConversation(c, req.user.sub))));
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
    assertParticipant(conversation, req.user.sub);

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
