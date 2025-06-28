const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['text', 'image']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get recent messages
chatSchema.methods.getRecentMessages = function(limit = 5) {
  return this.messages.slice(-limit);
};

// Method to add a message
chatSchema.methods.addMessage = function(role, content, contentType) {
  this.messages.push({ role, content, contentType });
  this.updatedAt = new Date();
  return this.save();
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 