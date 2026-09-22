const mongoose = require("mongoose");
const { WORK_MODES, AVAILABILITY_STATUSES } = require("../common/constants");

const mrProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true },
    profileImageUrl: { type: String, default: null },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String, default: "" },
    // Native arrays — this is the one genuine ergonomic win over the old SQLite version,
    // which had to JSON-stringify these into a TEXT column because SQLite has no array type.
    languages: { type: [String], default: [] },
    specializations: { type: [String], default: [] },
    territories: { type: [String], default: [] },
    companiesRepresented: { type: String, default: "" },
    workMode: { type: String, enum: WORK_MODES, default: "FIELD" },
    isIndependent: { type: Boolean, default: false },
    availabilityStatus: { type: String, enum: AVAILABILITY_STATUSES, default: "AVAILABLE" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MRProfile", mrProfileSchema);
