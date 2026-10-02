const mongoose = require("mongoose");

const { CONNECTION_STATUSES } = require("../common/constants");

const connectionSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (value) {
          if (!this.requesterId || !value) return true;
          return !this.requesterId.equals(value);
        },
        message: "Cannot create a connection with yourself",
      },
    },

    status: {
      type: String,
      enum: CONNECTION_STATUSES,
      default: "PENDING",
    },

    message: {
      type: String,
      default: "",
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate connection requests in the same direction
// at the database layer.
connectionSchema.index(
  { requesterId: 1, recipientId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Connection", connectionSchema);