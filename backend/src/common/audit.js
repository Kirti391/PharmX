const AuditLog = require("../models/AuditLog");

function recordAudit({ userId = null, action, targetType, targetId, metadata = null, ipAddress = null }) {
  // Fire-and-forget is fine here — an audit-log write failing shouldn't ever block the
  // actual user-facing action it's describing. We still await it so errors surface in
  // logs during development rather than vanishing silently.
  return AuditLog.create({ userId, action, targetType, targetId, metadata, ipAddress }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to record audit log:", err.message);
  });
}

module.exports = { recordAudit };
