const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const CompanyAuthorization = require("../src/models/CompanyAuthorization");
const PharmaCompanyProfile = require("../src/models/PharmaCompanyProfile");
const User = require("../src/models/User");
const VerificationDocument = require("../src/models/VerificationDocument");
const authorizationRouter = require("../src/modules/authorizations/routes");
const adminRouter = require("../src/modules/admin/routes");

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

function getRouteHandler(router, path, method) {
  const layer = router.stack.find(
    (item) => item.route?.path === path && item.route.methods[method]
  );
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function invoke(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ statusCode: this.statusCode, body });
        return this;
      },
    };
    handler(req, res, reject);
  });
}

describe("company-MR authorizations", () => {
  it("uses a partial unique index to prevent concurrent current authorizations", () => {
    const index = CompanyAuthorization.schema
      .indexes()
      .find(([, options]) =>
        options?.name === "uniq_current_company_authorization_per_mr"
      );

    assert.ok(index);
    assert.deepEqual(index[0], { companyId: 1, mrUserId: 1 });
    assert.equal(index[1].unique, true);
    assert.deepEqual(index[1].partialFilterExpression, {
      status: { $in: ["PENDING", "ACTIVE"] },
    });
  });

  it("includes naturally expired pending and active records in the admin expired filter", async () => {
    let query;
    stub(CompanyAuthorization, "find", (filter) => {
      query = filter;
      return { sort: async () => [] };
    });

    const result = await invoke(
      getRouteHandler(adminRouter, "/authorizations", "get"),
      { query: { status: "EXPIRED" } }
    );

    assert.equal(result.statusCode, 200);
    assert.deepEqual(query.$or[0], { status: "EXPIRED" });
    assert.deepEqual(query.$or[1].status, { $in: ["PENDING", "ACTIVE"] });
    assert.ok(query.$or[1].expiresAt.$lte instanceof Date);
  });

  it("does not let admins activate an authorization with an expired linked document", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    stub(CompanyAuthorization, "findById", async () => ({
      _id: "authorization-1",
      companyId: "company-1",
      mrUserId: "mr-1",
      verificationDocumentId: "document-1",
      status: "PENDING",
      expiresAt,
    }));
    stub(PharmaCompanyProfile, "findOne", () => ({
      select: async () => ({ _id: "company-1", userId: "company-user-1" }),
    }));
    stub(VerificationDocument, "exists", async () => true);
    let documentQuery;
    stub(VerificationDocument, "findOne", async (filter) => {
      documentQuery = filter;
      return null;
    });

    const result = await invoke(
      getRouteHandler(adminRouter, "/authorizations/:id/approve", "patch"),
      { params: { id: "authorization-1" }, user: { sub: "admin-1" } }
    );

    assert.equal(result.statusCode, 409);
    assert.equal(
      result.body.error.code,
      "APPROVED_DOCUMENT_REQUIRED"
    );
    assert.equal(documentQuery.status, "APPROVED");
    assert.equal(documentQuery.docType, "COMPANY_AUTHORIZATION");
    assert.deepEqual(documentQuery.$or[0], { expiryDate: null });
    assert.ok(documentQuery.$or[1].expiryDate.$gt instanceof Date);
    assert.ok(
      documentQuery.$or[1].expiryDate.$gt.getTime() > Date.now() - 1000
    );
  });

  it("returns a conflict if a concurrent request wins the unique index race", async () => {
    const companyId = "507f1f77bcf86cd799439011";
    const mrId = "507f1f77bcf86cd799439012";
    const documentId = "507f1f77bcf86cd799439013";
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const documentExpiry = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
    stub(PharmaCompanyProfile, "findOne", () => ({
      select: async () => ({
        _id: companyId,
        companyName: "Example Pharma",
        userId: "507f1f77bcf86cd799439014",
      }),
    }));
    stub(User, "findOne", () => ({
      select: async () => ({ _id: mrId }),
    }));
    stub(VerificationDocument, "findOne", () => ({
      select: async () => ({
        _id: documentId,
        companyId,
        expiryDate: documentExpiry,
      }),
    }));
    stub(VerificationDocument, "exists", async () => true);
    stub(CompanyAuthorization, "updateMany", async () => ({ modifiedCount: 0 }));
    stub(CompanyAuthorization, "findOne", async () => null);
    stub(CompanyAuthorization, "create", async () => {
      const error = new Error(
        "E11000 duplicate key error index: uniq_current_company_authorization_per_mr"
      );
      error.code = 11000;
      throw error;
    });

    const result = await invoke(
      getRouteHandler(authorizationRouter, "/", "post"),
      {
        user: { role: "MR", sub: mrId },
        body: {
          companyId,
          verificationDocumentId: documentId,
          categories: ["Dermatology"],
          territories: ["Haryana"],
          expiresAt: expiresAt.toISOString(),
        },
      }
    );

    assert.equal(result.statusCode, 409);
    assert.equal(
      result.body.error.code,
      "AUTHORIZATION_ALREADY_EXISTS"
    );
  });
});
