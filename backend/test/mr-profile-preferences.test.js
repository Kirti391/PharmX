const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const MRProfile = require("../src/models/MRProfile");
const {
  getMRProfileById,
  getMRProfileByUserId,
  updateMRProfile,
} = require("../src/modules/profiles/service");

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

function makeProfile(overrides = {}) {
  return {
    _id: "mr-profile",
    userId: "mr-user",
    fullName: "Asha Sharma",
    safetyPreferences: ["DAYTIME_MEETINGS"],
    preferredOpportunityTypes: ["MR_HIRING"],
    ...overrides,
  };
}

describe("MR profile safety and career preferences", () => {
  it("returns preferences to the profile owner only", async () => {
    const profile = makeProfile();
    stub(MRProfile, "findOne", async () => profile);
    stub(MRProfile, "findById", async () => profile);

    const ownProfile = await getMRProfileByUserId("mr-user");
    const publicProfile = await getMRProfileById("mr-profile");

    assert.deepEqual(ownProfile.safetyPreferences, ["DAYTIME_MEETINGS"]);
    assert.deepEqual(ownProfile.preferredOpportunityTypes, ["MR_HIRING"]);
    assert.equal("safetyPreferences" in publicProfile, false);
    assert.equal("preferredOpportunityTypes" in publicProfile, false);
  });

  it("saves only the supported preference fields", async () => {
    let update;
    stub(MRProfile, "findOneAndUpdate", async (_filter, patch, options) => {
      update = { patch, options };
      return makeProfile({
        safetyPreferences: ["PUBLIC_MEETING_PLACES"],
        preferredOpportunityTypes: ["PRODUCT_PROMOTION"],
      });
    });

    const result = await updateMRProfile("mr-user", {
      safetyPreferences: ["PUBLIC_MEETING_PLACES"],
      preferredOpportunityTypes: ["PRODUCT_PROMOTION"],
      privateNote: "ignore",
    });

    assert.deepEqual(update.patch.$set, {
      safetyPreferences: ["PUBLIC_MEETING_PLACES"],
      preferredOpportunityTypes: ["PRODUCT_PROMOTION"],
    });
    assert.equal(update.options.runValidators, true);
    assert.deepEqual(result.safetyPreferences, ["PUBLIC_MEETING_PLACES"]);
    assert.deepEqual(result.preferredOpportunityTypes, ["PRODUCT_PROMOTION"]);
  });
});
