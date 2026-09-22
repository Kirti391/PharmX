const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachmentUrl: { type: String, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
