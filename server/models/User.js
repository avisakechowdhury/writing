import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: [/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens']
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  streak: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  totalPosts: {
    type: Number,
    default: 0
  },
  lastWriteDate: {
    type: Date,
    default: null
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  preferences: {
    isAnonymous: {
      type: Boolean,
      default: false
    },
    reminderTime: {
      type: String,
      default: '20:00'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  pushSubscription: {
    type: Object,
    default: null
  },
  achievements: [{
    id: String,
    title: String,
    earnedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update streak method
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastWrite = this.lastWriteDate ? new Date(this.lastWriteDate) : null;
  
  if (!lastWrite) {
    this.streak = 1;
  } else {
    lastWrite.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastWrite) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.streak += 1;
    } else if (daysDiff > 1) {
      this.streak = 1; // Reset to 1 when starting a new streak
    }
    // If daysDiff === 0, user already wrote today, don't change streak
  }
  
  this.lastWriteDate = new Date();
};

// Check if streak should be reset (call this on login/app load)
userSchema.methods.checkStreakReset = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastWrite = this.lastWriteDate ? new Date(this.lastWriteDate) : null;
  
  if (lastWrite) {
    lastWrite.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastWrite) / (1000 * 60 * 60 * 24));
    
    // If more than 1 day has passed, reset streak to 0
    if (daysDiff > 1) {
      this.streak = 0;
      return true; // Streak was reset
    }
  }
  
  return false; // Streak not reset
};

// Calculate level based on points
userSchema.methods.updateLevel = function() {
  this.level = Math.floor(this.points / 100) + 1;
};

export default mongoose.model('User', userSchema);