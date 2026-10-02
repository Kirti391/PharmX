
const mongoose = require("mongoose");

const appointmentWindowSchema = new mongoose.Schema(
  {
    day: { type: String },
    start: { type: String },
    end: { type: String },
  },
  { _id: false }
);

const businessHoursSchema = new mongoose.Schema(
  {
    day: { type: String },
    open: { type: String },
    close: { type: String },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const verificationDocumentSchema = new mongoose.Schema(
  {
    name: { type: String },
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { _id: false }
);

const pharmacyProfileSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // ACCOUNT
    // --------------------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // --------------------------------------------------
    // BASIC PHARMACY INFORMATION
    // --------------------------------------------------

    pharmacyName: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    profileImage: {
      type: String,
      trim: true,
    },

    pharmacyType: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    yearEstablished: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    ownershipType: {
      type: String,
      trim: true,
    },

    businessHours: {
      type: [businessHoursSchema],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    // --------------------------------------------------
    // LOCATION
    // --------------------------------------------------

    // Kept for backward compatibility with the existing app.
    location: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    state: {
      type: String,
      trim: true,
    },

    pinCode: {
      type: String,
      trim: true,
    },

    serviceArea: {
      type: String,
      trim: true,
    },

    exactAddress: {
      type: String,
      trim: true,
    },

    showExactAddress: {
      type: Boolean,
      default: false,
    },

    mapLocation: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },

    // --------------------------------------------------
    // LEGAL & LICENSING
    // --------------------------------------------------

    drugLicenceNumber: {
      type: String,
      trim: true,
    },

    licenceType: {
      type: String,
      trim: true,
    },

    licenceIssueDate: {
      type: Date,
    },

    licenceExpiryDate: {
      type: Date,
    },

    licensingAuthority: {
      type: String,
      trim: true,
    },

    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },

    businessRegistration: {
      type: String,
      trim: true,
    },

    pharmacistDetails: {
      name: {
        type: String,
        trim: true,
      },
      registrationNumber: {
        type: String,
        trim: true,
      },
      qualification: {
        type: String,
        trim: true,
      },
      registrationAuthority: {
        type: String,
        trim: true,
      },
    },

    // --------------------------------------------------
    // VERIFICATION
    // --------------------------------------------------

    businessVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: [
        "NOT_SUBMITTED",
        "PENDING",
        "VERIFIED",
        "REJECTED",
        "EXPIRED",
      ],
      default: "NOT_SUBMITTED",
    },

    lastVerifiedDate: {
      type: Date,
    },

    nextVerificationDate: {
      type: Date,
    },

    verificationDocuments: {
      type: [verificationDocumentSchema],
      default: [],
    },

    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    // --------------------------------------------------
    // PROCUREMENT PREFERENCES
    // --------------------------------------------------

    interestedCategories: {
      type: [String],
      default: [],
    },

    preferredSuppliers: {
      type: [String],
      default: [],
    },

    newCompanyInterest: {
      type: Boolean,
      default: true,
    },

    alternativeBrandAcceptance: {
      type: Boolean,
      default: false,
    },

    demandRange: {
      type: String,
      trim: true,
    },

    deliveryPreferences: {
      type: [String],
      default: [],
    },

    coldChainRequirement: {
      type: Boolean,
      default: false,
    },

    urgentSupplyRequirement: {
      type: Boolean,
      default: false,
    },

    // --------------------------------------------------
    // COMMUNICATION / MR VISITS
    // --------------------------------------------------

    preferredCommunicationMethod: {
      type: String,
      trim: true,
    },

    preferredMRVisitHours: {
      type: [appointmentWindowSchema],
      default: [],
    },

    noVisitDays: {
      type: [String],
      default: [],
    },

    // Existing field retained for compatibility.
    preferredAppointmentWindows: {
      type: [appointmentWindowSchema],
      default: [],
    },

    // --------------------------------------------------
    // PRIVACY
    // --------------------------------------------------

    privacy: {
      showBusinessContact: {
        type: Boolean,
        default: true,
      },

      showExactAddress: {
        type: Boolean,
        default: false,
      },

      allowSupplierMessages: {
        type: Boolean,
        default: true,
      },

      allowMRMessages: {
        type: Boolean,
        default: true,
      },

      allowConnectionRequests: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PharmacyProfile",
  pharmacyProfileSchema
);

