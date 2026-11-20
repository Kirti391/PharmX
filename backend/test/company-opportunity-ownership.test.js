const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const Opportunity = require("../src/models/Opportunity");
const OpportunityApplication = require("../src/models/OpportunityApplication");
const PharmaCompanyProfile = require("../src/models/PharmaCompanyProfile");
const router = require("../src/modules/opportunities/routes");

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

function getOpportunityListHandler() {
  return getRouteHandler("/", "get");
}

function getRouteHandler(path, method) {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      status() {
        return this;
      },
      json(body) {
        resolve(body);
        return this;
      },
    };
    handler(req, res, reject);
  });
}

describe("company opportunity listing", () => {
  it("limits a company's all-status list to its own opportunities", async () => {
    let opportunityFilter;
    stub(PharmaCompanyProfile, "findOne", async () => ({
      _id: "company-profile-1",
      companyName: "Example Pharma",
    }));
    stub(Opportunity, "find", (filter) => {
      opportunityFilter = filter;
      return {
        sort: async () => [
          {
            _id: "opportunity-1",
            companyId: "company-profile-1",
            type: "MR_HIRING",
            title: "Medical representative",
            description: "An opportunity description.",
            categories: [],
            territories: [],
            status: "CLOSED",
            createdAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        ],
      };
    });

    const response = await invoke(getOpportunityListHandler(), {
      user: { role: "PHARMA_COMPANY", sub: "company-user-1" },
      query: { status: "ALL" },
    });

    assert.deepEqual(opportunityFilter, { companyId: "company-profile-1" });
    assert.equal(response.data.length, 1);
    assert.equal(response.data[0].status, "CLOSED");
    assert.equal(response.data[0].isOwner, true);
  });

  it("allows the owner to edit opportunity details and close the post", async () => {
    let saved = false;
    const row = {
      _id: "opportunity-1",
      companyId: "company-profile-1",
      type: "MR_HIRING",
      title: "Old title",
      description: "Old description.",
      categories: [],
      territories: [],
      status: "OPEN",
      async save() {
        saved = true;
      },
    };
    stub(PharmaCompanyProfile, "findOne", async () => ({
      _id: "company-profile-1",
    }));
    stub(Opportunity, "findById", async () => row);

    const response = await invoke(getRouteHandler("/:id", "patch"), {
      user: { role: "PHARMA_COMPANY", sub: "company-user-1" },
      params: { id: "opportunity-1" },
      body: {
        title: "Updated title",
        description: "Overview:\nAn updated description.",
        categories: ["Dermatology"],
        territories: ["Haryana"],
        status: "CLOSED",
      },
    });

    assert.equal(saved, true);
    assert.equal(response.data.title, "Updated title");
    assert.equal(response.data.status, "CLOSED");
    assert.deepEqual(response.data.categories, ["Dermatology"]);
  });

  it("deletes the owner's opportunity and its applications", async () => {
    let deletedApplications = false;
    let deletedOpportunity = false;
    const row = {
      _id: "opportunity-1",
      companyId: "company-profile-1",
      async deleteOne() {
        deletedOpportunity = true;
      },
    };
    stub(PharmaCompanyProfile, "findOne", async () => ({
      _id: "company-profile-1",
    }));
    stub(Opportunity, "findById", async () => row);
    stub(OpportunityApplication, "deleteMany", async (filter) => {
      assert.deepEqual(filter, { opportunityId: "opportunity-1" });
      deletedApplications = true;
    });

    const response = await invoke(getRouteHandler("/:id", "delete"), {
      user: { role: "PHARMA_COMPANY", sub: "company-user-1" },
      params: { id: "opportunity-1" },
    });

    assert.deepEqual(response.data, { deleted: true });
    assert.equal(deletedApplications, true);
    assert.equal(deletedOpportunity, true);
  });
});
