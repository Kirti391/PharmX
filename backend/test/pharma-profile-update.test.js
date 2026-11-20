const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const PharmaCompanyProfile = require("../src/models/PharmaCompanyProfile");
const {
  getPharmaProfileById,
  updatePharmaProfile,
} = require("../src/modules/profiles/service");

const originalFindOneAndUpdate = PharmaCompanyProfile.findOneAndUpdate;
const originalFindById = PharmaCompanyProfile.findById;

afterEach(() => {
  PharmaCompanyProfile.findOneAndUpdate = originalFindOneAndUpdate;
  PharmaCompanyProfile.findById = originalFindById;
});

describe("pharma company profile updates", () => {
  it("returns private contact fields after a successful profile update", async () => {
    const persistedProfile = {
      _id: "profile-1",
      userId: "user-1",
      companyName: "Test Pharma",
      brandName: "Test Brand",
      entityType: "Private Limited",
      yearEstablished: 2008,
      supportEmail: "support@test.example",
      expansionTerritories: ["Rajasthan"],
      drugLicenceNumber: "DL-12345",
      contactPersonName: "A. Contact",
      contactPersonDesignation: "Partnerships Lead",
      businessVerified: false,
      verificationStatus: "PENDING",
    };
    let updateCall;

    PharmaCompanyProfile.findOneAndUpdate = async (...args) => {
      updateCall = args;
      return persistedProfile;
    };

    const result = await updatePharmaProfile("user-1", {
      companyName: "Test Pharma",
      brandName: "Test Brand",
      entityType: "Private Limited",
      yearEstablished: 2008,
      supportEmail: "support@test.example",
      expansionTerritories: ["Rajasthan"],
      drugLicenceNumber: "DL-12345",
      contactPersonName: "A. Contact",
      contactPersonDesignation: "Partnerships Lead",
      businessVerified: true,
    });

    assert.deepEqual(updateCall[1].$set, {
      companyName: "Test Pharma",
      brandName: "Test Brand",
      entityType: "Private Limited",
      yearEstablished: 2008,
      supportEmail: "support@test.example",
      expansionTerritories: ["Rajasthan"],
      drugLicenceNumber: "DL-12345",
      contactPersonName: "A. Contact",
      contactPersonDesignation: "Partnerships Lead",
    });
    assert.equal(updateCall[2].runValidators, true);
    assert.equal(result.brandName, "Test Brand");
    assert.equal(result.entityType, "Private Limited");
    assert.equal(result.yearEstablished, 2008);
    assert.equal(result.supportEmail, "support@test.example");
    assert.deepEqual(result.expansionTerritories, ["Rajasthan"]);
    assert.equal(result.drugLicenceNumber, "DL-12345");
    assert.equal(result.contactPersonName, "A. Contact");
    assert.equal(result.contactPersonDesignation, "Partnerships Lead");
    assert.equal(result.businessVerified, false);
  });

  it("keeps contact person details private on public company profiles", async () => {
    PharmaCompanyProfile.findById = async () => ({
      _id: "profile-1",
      companyName: "Test Pharma",
      brandName: "Test Brand",
      entityType: "Private Limited",
      yearEstablished: 2008,
      supportEmail: "support@test.example",
      expansionTerritories: ["Rajasthan"],
      drugLicenceNumber: "DL-12345",
      contactPersonName: "A. Contact",
      contactPersonDesignation: "Partnerships Lead",
    });

    const result = await getPharmaProfileById("profile-1");

    assert.equal("contactPersonName" in result, false);
    assert.equal("contactPersonDesignation" in result, false);
    assert.equal(result.brandName, "Test Brand");
    assert.equal(result.entityType, "Private Limited");
    assert.equal(result.yearEstablished, 2008);
    assert.equal(result.supportEmail, "support@test.example");
    assert.deepEqual(result.expansionTerritories, ["Rajasthan"]);
    assert.equal("drugLicenceNumber" in result, false);
  });
});
