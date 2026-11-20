const assert = require("node:assert/strict");
const { afterEach, describe, it } = require("node:test");

const DoctorProfile = require("../src/models/DoctorProfile");
const { updateDoctorProfile } = require("../src/modules/profiles/service");

const originalFindOne = DoctorProfile.findOne;
const originalFindOneAndUpdate = DoctorProfile.findOneAndUpdate;

afterEach(() => {
  DoctorProfile.findOne = originalFindOne;
  DoctorProfile.findOneAndUpdate = originalFindOneAndUpdate;
});

describe("doctor profile updates", () => {
  it("persists an uploaded profile photo without allowing verification changes", async () => {
    const profile = {
      _id: "doctor-profile-1",
      userId: "doctor-1",
      fullName: "Test Doctor",
      profileImageUrl: null,
      registrationStatus: "NOT_SUBMITTED",
      acceptsMRRequests: false,
      acceptsCompanyInformation: false,
      acceptedCategories: [],
      communicationModes: ["VIDEO"],
      appointmentDurationMinutes: 15,
      maximumRequestsPerWeek: 3,
    };
    const updatedProfile = {
      ...profile,
      profileImageUrl: "/uploads/doctor-photo.jpg",
    };
    let updateCall;

    DoctorProfile.findOne = async () => profile;
    DoctorProfile.findOneAndUpdate = async (...args) => {
      updateCall = args;
      return updatedProfile;
    };

    const result = await updateDoctorProfile("doctor-1", {
      profileImageUrl: "/uploads/doctor-photo.jpg",
      businessVerified: true,
    });

    assert.deepEqual(updateCall[1].$set, {
      profileImageUrl: "/uploads/doctor-photo.jpg",
    });
    assert.equal(updateCall[2].runValidators, true);
    assert.equal(result.profileImageUrl, "/uploads/doctor-photo.jpg");
    assert.equal(result.businessVerified, undefined);
  });
});
