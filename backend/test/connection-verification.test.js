const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const VerificationDocument = require("../src/models/VerificationDocument");
const {
  hasCurrentConnectionVerification,
} = require("../src/modules/connections/verification");

const originalMethods = [];

function stub(target, method, implementation) {
  originalMethods.push([target, method, target[method]]);
  target[method] = implementation;
}

afterEach(() => {
  while (originalMethods.length) {
    const [target, method, original] = originalMethods.pop();
    target[method] = original;
  }
});

describe("MR connection verification", () => {
  it("allows an MR with a current admin-approved identity proof", async () => {
    let query;
    stub(VerificationDocument, "exists", async (filter) => {
      query = filter;
      return { _id: "approved-id-proof" };
    });
    const now = new Date("2026-11-19T00:00:00.000Z");

    const eligible = await hasCurrentConnectionVerification({
      _id: "mr-user",
      role: "MR",
    }, now);

    assert.equal(eligible, true);
    assert.equal(query.userId, "mr-user");
    assert.equal(query.docType, "ID_PROOF");
    assert.equal(query.status, "APPROVED");
    assert.deepEqual(query.$or, [
      { expiryDate: null },
      { expiryDate: { $gt: now } },
    ]);
  });

  it("does not allow an MR whose identity proof is not currently approved", async () => {
    stub(VerificationDocument, "exists", async () => null);

    const eligible = await hasCurrentConnectionVerification({
      _id: "mr-user",
      role: "MR",
    });

    assert.equal(eligible, false);
  });
});
