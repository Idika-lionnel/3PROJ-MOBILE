const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  attachmentUrl: String,
  type: { type: String, enum: ['text', 'file'], default: 'text' },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
    messages: [messageSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);