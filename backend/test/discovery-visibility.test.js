const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const User = require("../src/models/User");
const MRProfile = require("../src/models/MRProfile");
const PharmaCompanyProfile = require("../src/models/PharmaCompanyProfile");
const PharmacyProfile = require("../src/models/PharmacyProfile");
const StockistProfile = require("../src/models/StockistProfile");
const VerificationDocument = require("../src/models/VerificationDocument");
const CompanyAuthorization = require("../src/models/CompanyAuthorization");
const {
  listMRs,
  listPharmaCompanies,
  listPharmacies,
  listStockists,
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

function profileQuery(rows) {
  return {
    sort: async () => rows,
  };
}

describe("discovery profile visibility", () => {
  it("shows active accounts before verification but marks them ineligible to connect", async () => {
    const userId = "user-1";
    const user = { _id: userId, role: "PHARMA_COMPANY" };
    const company = {
      _id: "profile-1",
      userId,
      companyName: "New Company",
      businessVerified: false,
      verificationStatus: "NOT_SUBMITTED",
    };

    stub(PharmaCompanyProfile, "find", () => profileQuery([company]));
    stub(User, "find", () => ({
      select: async () => [user],
    }));
    stub(VerificationDocument, "exists", async () => false);

    const results = await listPharmaCompanies({});

    assert.equal(results.length, 1);
    assert.equal(results[0].companyName, "New Company");
    assert.equal(results[0].connectionEligible, false);
  });

  it("keeps all role discovery lists available to active accounts before verification", async () => {
    const userId = "user-2";
    const activeUser = { _id: userId, role: "MR" };
    const mr = { _id: "mr-profile", userId, fullName: "New MR" };
    const pharmacy = {
      _id: "pharmacy-profile",
      userId,
      pharmacyName: "New Pharmacy",
    };
    const stockist = {
      _id: "stockist-profile",
      userId,
      companyName: "New Stockist",
    };

    stub(User, "distinct", async () => [userId]);
    stub(User, "find", () => ({
      select: async () => [activeUser],
    }));
    stub(MRProfile, "find", () => profileQuery([mr]));
    stub(PharmacyProfile, "find", () => profileQuery([pharmacy]));
    stub(StockistProfile, "find", () => profileQuery([stockist]));
    stub(VerificationDocument, "exists", async () => false);
    stub(CompanyAuthorization, "find", () => ({
      select: async () => [],
    }));

    const [mrs, pharmacies, stockists] = await Promise.all([
      listMRs({}),
      listPharmacies({}),
      listStockists({}),
    ]);

    assert.equal(mrs[0].fullName, "New MR");
    assert.equal(pharmacies[0].pharmacyName, "New Pharmacy");
    assert.equal(stockists[0].companyName, "New Stockist");
    assert.equal(mrs[0].connectionEligible, false);
    assert.equal(pharmacies[0].connectionEligible, false);
    assert.equal(stockists[0].connectionEligible, false);
  });

  it("filters stockist array fields by literal case-insensitive text", async () => {
    let query;
    stub(StockistProfile, "find", (filter) => {
      query = filter;
      return profileQuery([]);
    });
    stub(User, "find", () => ({
      select: async () => [],
    }));

    await listStockists({
      territory: "South Delhi",
      category: "OTC+",
      type: "DISTRIBUTOR",
    });

    assert.equal(query.type, "DISTRIBUTOR");
    assert.deepEqual(query.serviceAreas, {
      $elemMatch: { $regex: "South Delhi", $options: "i" },
    });
    assert.deepEqual(query.productCategories, {
      $elemMatch: { $regex: "OTC\\+", $options: "i" },
    });
  });
});
