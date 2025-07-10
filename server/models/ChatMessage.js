import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  room: {
    type: String,
    default: 'general'
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
chatMessageSchema.index({ createdAt: -1 });
chatMessageSchema.index({ room: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);