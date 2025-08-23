import mongoose from 'mongoose';

const randomChatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    }
  }],
  topic: {
    type: String,
    required: true,
    enum: ['general', 'books', 'movies', 'music', 'technology', 'travel', 'food', 'sports', 'art', 'philosophy']
  },
  status: {
    type: String,
    enum: ['searching', 'active', 'ended'],
    default: 'searching'
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  }],
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
randomChatSchema.index({ status: 1, topic: 1 });
randomChatSchema.index({ 'participants.userId': 1 });
randomChatSchema.index({ sessionId: 1 });

export default mongoose.model('RandomChat', randomChatSchema);
