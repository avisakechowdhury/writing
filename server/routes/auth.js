import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, dots, underscores, and hyphens')
    .trim(),
  body('displayName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters long')
    .trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Registration validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }

    const { email, password, username, displayName } = req.body;
    
    console.log('Registration attempt:', {
      email,
      username,
      displayName,
      passwordLength: password ? password.length : 0
    });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      username,
      displayName
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      streak: user.streak,
      points: user.points,
      level: user.level,
      totalPosts: user.totalPosts,
      joinedDate: user.createdAt,
      preferences: user.preferences
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data without password
    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      streak: user.streak,
      points: user.points,
      level: user.level,
      totalPosts: user.totalPosts,
      joinedDate: user.createdAt,
      preferences: user.preferences
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    // Check if streak should be reset
    const streakReset = req.user.checkStreakReset();
    if (streakReset) {
      await req.user.save();
    }
    
    const userData = {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      displayName: req.user.displayName,
      streak: req.user.streak,
      points: req.user.points,
      level: req.user.level,
      totalPosts: req.user.totalPosts,
      joinedDate: req.user.createdAt,
      preferences: req.user.preferences
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, [
  body('displayName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('preferences.reminderTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('preferences.notifications').optional().isBoolean(),
  body('preferences.timezone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    const { displayName, preferences } = req.body;

    if (displayName) updates.displayName = displayName;
    if (preferences) {
      updates.preferences = { ...req.user.preferences, ...preferences };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    const userData = {
      id: user._id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      streak: user.streak,
      points: user.points,
      level: user.level,
      totalPosts: user.totalPosts,
      joinedDate: user.createdAt,
      preferences: user.preferences
    };

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

export default router;