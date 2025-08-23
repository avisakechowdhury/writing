import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedItemType: {
    type: String,
    enum: ['post', 'comment', 'chat_message', 'user'],
    required: true
  },
  reportedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'spam',
      'inappropriate_content',
      'harassment',
      'hate_speech',
      'violence',
      'misinformation',
      'copyright_violation',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    maxlength: 500,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  moderatorNotes: {
    type: String,
    maxlength: 1000
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
reportSchema.index({ status: 1, reportedItemType: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ reportedItemId: 1 });

export default mongoose.model('Report', reportSchema);
