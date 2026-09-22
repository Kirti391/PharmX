const mongoose = require("mongoose");
const { CONNECTION_STATUSES } = require("../common/constants");

const connectionSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: CONNECTION_STATUSES, default: "PENDING" },
    message: { type: String, default: "" },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Mongo equivalent of the old SQL UNIQUE(requester_id, recipient_id) constraint —
// this is what actually prevents duplicate connection requests, at the DB layer.
connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.model("Connection", connectionSchema);
