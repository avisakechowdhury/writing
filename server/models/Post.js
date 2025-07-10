import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    likes: {
      type: Number,
      default: 0
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      emoji: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'anxious', 'grateful', 'peaceful', 'excited', 'thoughtful', 'frustrated'],
    required: false
  },
  wordCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isDraft: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ isPublic: 1, isDraft: 1 });

// Calculate word count before saving
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const text = this.content.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
  }
  next();
});

export default mongoose.model('Post', postSchema);