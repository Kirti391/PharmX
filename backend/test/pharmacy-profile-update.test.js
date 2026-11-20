const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const PharmacyProfile = require("../src/models/PharmacyProfile");
const { updatePharmacyProfile } = require("../src/modules/profiles/service");

const originalFindOneAndUpdate = PharmacyProfile.findOneAndUpdate;

afterEach(() => {
  PharmacyProfile.findOneAndUpdate = originalFindOneAndUpdate;
});

describe("pharmacy profile updates", () => {
  it("saves schema-shaped values and returns private profile fields", async () => {
    const businessHours = [
      { day: "Monday", open: "09:00", close: "17:00", closed: false },
    ];
    const preferredMRVisitHours = [
      { day: "Tuesday", start: "14:00", end: "17:00" },
    ];
    const verificationDocuments = [{ name: "Old certificate" }];
    const persistedProfile = {
      _id: "profile-1",
      userId: "user-1",
      pharmacyName: "Test Pharmacy",
      location: "Pune",
      businessHours,
      preferredMRVisitHours,
      newCompanyInterest: false,
      pharmacistDetails: { name: "Test Pharmacist" },
      verificationDocuments,
    };
    let updateCall;

    PharmacyProfile.findOneAndUpdate = async (...args) => {
      updateCall = args;
      return persistedProfile;
    };

    const result = await updatePharmacyProfile("user-1", {
      businessHours,
      preferredMRVisitHours,
      newCompanyInterest: false,
      pharmacistDetails: { name: "Test Pharmacist" },
      businessVerified: true,
      verificationDocuments: [{ name: "Unreviewed certificate" }],
    });

    assert.deepEqual(updateCall[1].$set, {
      businessHours,
      preferredMRVisitHours,
      newCompanyInterest: false,
      pharmacistDetails: { name: "Test Pharmacist" },
    });
    assert.equal(updateCall[2].runValidators, true);
    assert.deepEqual(result.businessHours, businessHours);
    assert.deepEqual(result.preferredMRVisitHours, preferredMRVisitHours);
    assert.deepEqual(result.pharmacistDetails, {
      name: "Test Pharmacist",
    });
    assert.deepEqual(result.verificationDocuments, verificationDocuments);
  });
});
