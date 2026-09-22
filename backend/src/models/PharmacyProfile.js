const mongoose = require("mongoose");

const appointmentWindowSchema = new mongoose.Schema(
  {
    day: String,
    start: String,
    end: String,
  },
  { _id: false }
);

const pharmacyProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    pharmacyName: { type: String, required: true },
    location: { type: String, required: true },
    businessVerified: { type: Boolean, default: false },
    interestedCategories: { type: [String], default: [] },
    preferredAppointmentWindows: { type: [appointmentWindowSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PharmacyProfile", pharmacyProfileSchema);
