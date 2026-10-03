const mongoose = require("mongoose");

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    specialty: {
      type: String,
      default: "",
      trim: true,
    },

    subspecialty: {
      type: String,
      default: "",
      trim: true,
    },

    qualification: {
      type: String,
      default: "",
      trim: true,
    },

    registrationCouncil: {
      type: String,
      default: "",
      trim: true,
    },

    registrationNumber: {
      type: String,
      default: "",
      trim: true,
    },

    registrationStatus: {
      type: String,
      enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED", "EXPIRED"],
      default: "NOT_SUBMITTED",
    },

    clinicHospitalAffiliation: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    languages: {
      type: [String],
      default: [],
    },

    professionalInterests: {
      type: [String],
      default: [],
    },

    profileImageUrl: {
      type: String,
      default: null,
    },

    acceptsMRRequests: {
      type: Boolean,
      default: false,
    },

    acceptsCompanyInformation: {
      type: Boolean,
      default: false,
    },

    acceptedCategories: {
      type: [String],
      default: [],
    },

    communicationModes: {
      type: [String],
      enum: ["VIDEO", "PHYSICAL"],
      default: [],
    },

    appointmentDurationMinutes: {
      type: Number,
      min: 5,
      max: 240,
      default: 15,
    },

    maximumRequestsPerWeek: {
      type: Number,
      min: 1,
      max: 50,
      default: 5,
    },

    blockedUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    businessVerified: {
      type: Boolean,
      default: false,
    },

    verificationDate: {
      type: Date,
      default: null,
    },

    reVerificationDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);