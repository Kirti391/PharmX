const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  MESSAGE_EDIT_WINDOW_MS,
  isWithinMessageEditWindow,
} = require("../src/modules/messaging/editWindow");

describe("isWithinMessageEditWindow", () => {
  const now = Date.parse("2026-10-06T12:00:00.000Z");

  it("allows messages younger than two minutes", () => {
    assert.equal(
      isWithinMessageEditWindow(now - MESSAGE_EDIT_WINDOW_MS + 1, now),
      true
    );
  });

  it("rejects messages at and after the two-minute cutoff", () => {
    assert.equal(
      isWithinMessageEditWindow(now - MESSAGE_EDIT_WINDOW_MS, now),
      false
    );
    assert.equal(
      isWithinMessageEditWindow(now - MESSAGE_EDIT_WINDOW_MS - 1, now),
      false
    );
  });

  it("rejects invalid and future timestamps", () => {
    assert.equal(isWithinMessageEditWindow("invalid", now), false);
    assert.equal(isWithinMessageEditWindow(now + 1, now), false);
  });
});
