import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canEditMessage, MESSAGE_EDIT_WINDOW_MS } from "./messageEditing.js";

describe("canEditMessage", () => {
  const now = Date.parse("2026-10-06T12:00:00.000Z");
  const message = (age, overrides = {}) => ({
    createdAt: new Date(now - age).toISOString(),
    ...overrides,
  });

  it("allows messages younger than two minutes", () => {
    assert.equal(canEditMessage(message(MESSAGE_EDIT_WINDOW_MS - 1), now), true);
  });

  it("expires messages at and after two minutes", () => {
    assert.equal(canEditMessage(message(MESSAGE_EDIT_WINDOW_MS), now), false);
    assert.equal(canEditMessage(message(MESSAGE_EDIT_WINDOW_MS + 1), now), false);
  });

  it("rejects deleted messages, invalid timestamps, and future timestamps", () => {
    assert.equal(canEditMessage(message(0, { isDeleted: true }), now), false);
    assert.equal(canEditMessage(message(0, { createdAt: "invalid" }), now), false);
    assert.equal(canEditMessage(message(-1), now), false);
  });
});
