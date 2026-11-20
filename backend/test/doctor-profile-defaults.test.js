const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const mongoose = require("mongoose");

const DoctorProfile = require("../src/models/DoctorProfile");

describe("doctor profile defaults and constraints", () => {
  it("uses the documented communication and request defaults", () => {
    const profile = new DoctorProfile({
      userId: new mongoose.Types.ObjectId(),
      fullName: "Test Doctor",
      location: "Pune",
    });

    assert.equal(profile.acceptsMRRequests, false);
    assert.equal(profile.acceptsCompanyInformation, false);
    assert.deepEqual(profile.acceptedCategories, []);
    assert.deepEqual(profile.communicationModes, ["VIDEO"]);
    assert.equal(profile.appointmentDurationMinutes, 15);
    assert.equal(profile.maximumRequestsPerWeek, 3);
  });

  it("enforces the documented appointment and weekly request limits", () => {
    const profile = new DoctorProfile({
      userId: new mongoose.Types.ObjectId(),
      fullName: "Test Doctor",
      location: "Pune",
      appointmentDurationMinutes: 61,
      maximumRequestsPerWeek: 21,
    });

    const validationError = profile.validateSync();

    assert.equal(
      validationError.errors.appointmentDurationMinutes.kind,
      "max"
    );
    assert.equal(
      validationError.errors.maximumRequestsPerWeek.kind,
      "max"
    );
  });

  it("accepts the documented limits, including zero weekly requests", () => {
    const profile = new DoctorProfile({
      userId: new mongoose.Types.ObjectId(),
      fullName: "Test Doctor",
      location: "Pune",
      appointmentDurationMinutes: 5,
      maximumRequestsPerWeek: 0,
    });

    assert.equal(profile.validateSync(), undefined);

    profile.appointmentDurationMinutes = 60;
    profile.maximumRequestsPerWeek = 20;
    assert.equal(profile.validateSync(), undefined);
  });

  it("rejects values below the documented minimums", () => {
    const profile = new DoctorProfile({
      userId: new mongoose.Types.ObjectId(),
      fullName: "Test Doctor",
      location: "Pune",
      appointmentDurationMinutes: 4,
      maximumRequestsPerWeek: -1,
    });

    const validationError = profile.validateSync();

    assert.equal(
      validationError.errors.appointmentDurationMinutes.kind,
      "min"
    );
    assert.equal(
      validationError.errors.maximumRequestsPerWeek.kind,
      "min"
    );
  });
});
