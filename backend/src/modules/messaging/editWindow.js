const MESSAGE_EDIT_WINDOW_MS = 2 * 60 * 1000;

function isWithinMessageEditWindow(createdAt, now = Date.now()) {
  const createdAtMs = new Date(createdAt).getTime();
  const age = now - createdAtMs;
  return Number.isFinite(createdAtMs) && age >= 0 && age < MESSAGE_EDIT_WINDOW_MS;
}

module.exports = { MESSAGE_EDIT_WINDOW_MS, isWithinMessageEditWindow };
