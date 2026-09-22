const Notification = require("../../models/Notification");
const { emitRealtime } = require("../../realtime/bus");

async function createNotification({ userId, type, title, body, data = null }) {
  const notification = await Notification.create({ userId, type, title, body, data });
  emitRealtime({ type: "notification:new", userId: userId.toString(), payload: serialize(notification) });
  return notification;
}

async function listNotifications(userId) {
  const rows = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
  return rows.map(serialize);
}

async function markRead(userId, notificationId) {
  await Notification.updateOne(
    { _id: notificationId, userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
}

async function markAllRead(userId) {
  await Notification.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
}

function serialize(n) {
  return {
    id: n._id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    body: n.body,
    data: n.data,
    readAt: n.readAt,
    createdAt: n.createdAt,
  };
}

module.exports = { createNotification, listNotifications, markRead, markAllRead, serialize };
