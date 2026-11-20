const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");

const OpportunityApplication = require("../src/models/OpportunityApplication");

describe("opportunity applications", () => {
  it("stores the applicant's submitted note and profile snapshot", async () => {
    const application = new OpportunityApplication({
      opportunityId: new mongoose.Types.ObjectId(),
      applicantUserId: new mongoose.Types.ObjectId(),
      message: "I am interested in this role.",
      applicantProfile: {
        fullName: "Asha Sharma",
        email: "asha@example.test",
        mobile: "9876543210",
        territories: ["Delhi"],
      },
    });

    await application.validate();

    assert.equal(application.status, "PENDING");
    assert.equal(application.message, "I am interested in this role.");
    assert.equal(application.applicantProfile.fullName, "Asha Sharma");
    assert.equal(application.applicantProfile.email, "asha@example.test");
    assert.deepEqual(application.applicantProfile.territories, ["Delhi"]);
  });

  it("rejects an application note that exceeds the form limit", async () => {
    const application = new OpportunityApplication({
      opportunityId: new mongoose.Types.ObjectId(),
      applicantUserId: new mongoose.Types.ObjectId(),
      message: "x".repeat(2001),
    });

    await assert.rejects(application.validate(), /maximum allowed length/i);
  });
});
