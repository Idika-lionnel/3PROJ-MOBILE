const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String
  },
  attachmentUrl: {
    type: String
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DirectMessage', directMessageSchema);