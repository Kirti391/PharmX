const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const AuditLog = require("../src/models/AuditLog");
const FollowUp = require("../src/models/FollowUp");
const Lead = require("../src/models/Lead");
const router = require("../src/modules/leads/routes");

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

function getRouteHandler(path, method) {
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

describe("lead follow-up workflow", () => {
  it("creates a follow-up with the submitted future due date", async () => {
    const lead = {
      _id: "lead-1",
      targetUserId: "target-1",
      ownerCompanyId: null,
      stage: "NEW",
      history: [],
      async save() {},
    };
    const dueAt = new Date(Date.now() + 60_000);
    let followUpData;
    stub(Lead, "findOne", async () => lead);
    stub(FollowUp, "create", async (data) => {
      followUpData = data;
      return {
        _id: "follow-up-1",
        leadId: data.leadId,
        dueAt: data.dueAt,
        status: "PENDING",
        notes: data.notes,
      };
    });
    stub(FollowUp, "findOne", () => ({
      sort: async () => ({ dueAt }),
    }));
    stub(AuditLog, "create", async () => ({}));

    const result = await invoke(
      getRouteHandler("/:id/follow-ups", "post"),
      {
        user: { role: "MR", sub: "mr-1" },
        params: { id: "lead-1" },
        body: {
          dueAt: dueAt.toISOString(),
          notes: "Check in next week",
        },
      }
    );

    assert.equal(result.statusCode, 201);
    assert.deepEqual(followUpData.dueAt, dueAt);
    assert.equal(followUpData.ownerUserId, "mr-1");
    assert.equal(followUpData.notes, "Check in next week");
    assert.equal(lead.stage, "FOLLOW_UP");
    assert.deepEqual(lead.nextFollowUpAt, dueAt);
    assert.equal(result.body.data.status, "PENDING");
  });

  it("rejects a follow-up due date that is not in the future", async () => {
    let created = false;
    stub(FollowUp, "create", async () => {
      created = true;
    });

    const result = await invoke(
      getRouteHandler("/:id/follow-ups", "post"),
      {
        user: { role: "MR", sub: "mr-1" },
        params: { id: "lead-1" },
        body: {
          dueAt: new Date(Date.now() - 60_000).toISOString(),
        },
      }
    );

    assert.equal(result.statusCode, 400);
    assert.equal(result.body.error.code, "VALIDATION_ERROR");
    assert.equal(created, false);
  });
});
