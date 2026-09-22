const mongoose = require("mongoose");
const { APPOINTMENT_MODES, APPOINTMENT_STATUSES, DISRUPTION_REASONS } = require("../common/constants");

const appointmentSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    mode: { type: String, enum: APPOINTMENT_MODES, default: "PHYSICAL" },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: "CONFIRMED" },
    disruptionReason: { type: String, enum: [...DISRUPTION_REASONS, null], default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
