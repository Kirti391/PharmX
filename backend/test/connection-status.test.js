const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  getConnectionStatuses,
} = require("../src/modules/connections/status");

describe("discovery connection status", () => {
  it("distinguishes sent and received pending requests", () => {
    const statuses = getConnectionStatuses(
      [
        {
          requesterId: "current-user",
          recipientId: "outgoing-user",
          status: "PENDING",
        },
        {
          requesterId: "incoming-user",
          recipientId: "current-user",
          status: "PENDING",
        },
      ],
      "current-user"
    );

    assert.equal(statuses.get("outgoing-user"), "PENDING_OUTGOING");
    assert.equal(statuses.get("incoming-user"), "PENDING_INCOMING");
  });

  it("keeps accepted status ahead of older pending requests", () => {
    const statuses = getConnectionStatuses(
      [
        {
          requesterId: "current-user",
          recipientId: "other-user",
          status: "PENDING",
        },
        {
          requesterId: "other-user",
          recipientId: "current-user",
          status: "ACCEPTED",
        },
      ],
      "current-user"
    );

    assert.equal(statuses.get("other-user"), "ACCEPTED");
  });
});
