const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participantIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (arr) => arr.length === 2,
        message: "A conversation must have exactly 2 participants (this MVP is 1:1 chat only).",
      },
    },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
