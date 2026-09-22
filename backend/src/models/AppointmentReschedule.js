const mongoose = require("mongoose");

const appointmentRescheduleSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    proposedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Native array of Dates — no JSON.stringify needed, unlike the SQLite version.
    proposedSlots: { type: [Date], required: true },
    acceptedSlot: { type: Date, default: null },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppointmentReschedule", appointmentRescheduleSchema);
