const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const { getRequirementStage } = require("../src/modules/requirements/workflow");

describe("pharmacy requirement workflow stages", () => {
  it("keeps a requirement in open until matching activity exists", () => {
    assert.equal(
      getRequirementStage(
        { status: "OPEN", matchingCount: 0 },
        [],
        new Set()
      ),
      "OPEN"
    );
  });

  it("advances from open through matching, responses, shortlist, and connection", () => {
    const requirement = { status: "OPEN", matchingCount: 2 };
    const responderId = "supplier-1";

    assert.equal(getRequirementStage(requirement, [], new Set()), "MATCHING");
    assert.equal(
      getRequirementStage(
        requirement,
        [{ status: "PENDING", responderUserId: responderId }],
        new Set()
      ),
      "RESPONSES"
    );
    assert.equal(
      getRequirementStage(
        requirement,
        [{ status: "SHORTLISTED", responderUserId: responderId }],
        new Set()
      ),
      "SHORTLISTED"
    );
    assert.equal(
      getRequirementStage(
        requirement,
        [{ status: "SHORTLISTED", responderUserId: responderId }],
        new Set([responderId])
      ),
      "CONNECTED"
    );
  });

  it("keeps terminal stages ahead of active workflow data", () => {
    const responses = [
      { status: "SHORTLISTED", responderUserId: "supplier-1" },
    ];
    const connectedResponders = new Set(["supplier-1"]);

    assert.equal(
      getRequirementStage(
        { status: "FULFILLED" },
        responses,
        connectedResponders
      ),
      "FULFILLED"
    );
    assert.equal(
      getRequirementStage(
        { status: "CLOSED" },
        responses,
        connectedResponders
      ),
      "CLOSED"
    );
  });
});
