export const MESSAGE_EDIT_WINDOW_MS = 2 * 60 * 1000;

export function canEditMessage(message, now = Date.now()) {
  if (!message || message.isDeleted) return false;

  const createdAt = new Date(message.createdAt).getTime();
  const age = now - createdAt;
  return Number.isFinite(createdAt) && age >= 0 && age < MESSAGE_EDIT_WINDOW_MS;
}
