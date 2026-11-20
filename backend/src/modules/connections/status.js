const STATUS_PRIORITY = {
  DECLINED: 1,
  PENDING_INCOMING: 2,
  PENDING_OUTGOING: 2,
  ACCEPTED: 3,
};

function getConnectionStatuses(connections, userId) {
  const statuses = new Map();
  const currentUserId = String(userId);

  for (const connection of connections) {
    const requesterId = connection.requesterId.toString();
    const recipientId = connection.recipientId.toString();
    const otherUserId =
      requesterId === currentUserId ? recipientId : requesterId;
    const status =
      connection.status === "PENDING"
        ? requesterId === currentUserId
          ? "PENDING_OUTGOING"
          : "PENDING_INCOMING"
        : connection.status;
    const currentStatus = statuses.get(otherUserId);

    if (
      !currentStatus ||
      STATUS_PRIORITY[status] > STATUS_PRIORITY[currentStatus]
    ) {
      statuses.set(otherUserId, status);
    }
  }

  return statuses;
}

module.exports = { getConnectionStatuses };
