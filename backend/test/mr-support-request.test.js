const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  getMRSupportRequestValidationError,
} = require("../src/modules/requirements/workflow");

describe("Medical Representative support request types", () => {
  it("requires a supported therapeutic area and request type when targeting MRs", () => {
    assert.equal(
      getMRSupportRequestValidationError("MR", "Cardiology", undefined),
      "REQUEST_TYPE_REQUIRED"
    );
    assert.equal(
      getMRSupportRequestValidationError("MR", "TABLETS", "PHARMACY_VISIT"),
      "INVALID_THERAPEUTIC_AREA"
    );
    assert.equal(
      getMRSupportRequestValidationError(
        "MR",
        "Cardiology",
        "PRODUCT_INFORMATION"
      ),
      null
    );
  });

  it("rejects support request types for procurement suppliers", () => {
    assert.equal(
      getMRSupportRequestValidationError(
        "DISTRIBUTOR_STOCKIST",
        "TABLETS",
        undefined
      ),
      null
    );
    assert.equal(
      getMRSupportRequestValidationError(
        "COMPANY",
        "Cardiology",
        "PRODUCT_INFORMATION"
      ),
      "REQUEST_TYPE_NOT_ALLOWED"
    );
  });
});
