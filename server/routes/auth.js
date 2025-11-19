import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendEmailVerificationOTP, sendPasswordResetEmail, generateOTP } from '../services/emailService.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d' // Extended to 30 days
  });
};

const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '90', 10);
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

const hashRefreshToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const pruneExpiredRefreshTokens = (user) => {
  if (!user.refreshTokens) {
    user.refreshTokens = [];
    return;
  }
  const now = Date.now();
  user.refreshTokens = user.refreshTokens.filter(token => {
    if (!token.expiresAt) return false;
    const expiresAt = token.expiresAt instanceof Date ? token.expiresAt.getTime() : new Date(token.expiresAt).getTime();
    return expiresAt > now;
  });
};

const appendRefreshToken = (user) => {
  pruneExpiredRefreshTokens(user);
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  
  user.refreshTokens.push({ tokenHash, expiresAt });
  
  // Limit to last 5 sessions
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }
  
  return refreshToken;
};

const buildUserResponse = (user) => ({
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
});

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

    // Check if user already exists (including unverified accounts)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
        });
      } else {
        // User exists but not verified, update with new data and resend OTP
        existingUser.password = password;
        existingUser.username = username;
        existingUser.displayName = displayName;
        
        // Generate new OTP
        const otp = generateOTP();
        existingUser.emailVerificationToken = otp;
        existingUser.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await existingUser.save();

        // Send verification email
        const emailSent = await sendEmailVerificationOTP(email, otp);
        
        if (!emailSent) {
          return res.status(500).json({ 
            message: 'Failed to send verification email. Please try again.' 
          });
        }

        return res.status(201).json({
          message: 'Verification code sent to your email. Please verify to complete registration.',
          requiresVerification: true,
          email: existingUser.email
        });
      }
    }

    // Create new user (not active until email verified)
    const user = new User({
      email,
      password,
      username,
      displayName,
      isActive: false // User will be activated after email verification
    });

    // Generate OTP for email verification
    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const emailSent = await sendEmailVerificationOTP(email, otp);
    
    if (!emailSent) {
      // If email fails, delete the user
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email for verification code.',
      requiresVerification: true,
      email: user.email
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

    const refreshToken = appendRefreshToken(user);
    await user.save();

    const token = generateToken(user._id);
    const userData = buildUserResponse(user);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
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
    
    const userData = buildUserResponse(req.user);
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

    const userData = buildUserResponse(user);

    res.json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Send email verification OTP
router.post('/send-verification-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.emailVerificationToken = otp;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const emailSent = await sendEmailVerificationOTP(email, otp);
    
    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Send verification OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email with OTP
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Check if OTP is valid
    if (user.emailVerificationToken !== otp || user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Verify email and activate user
    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    
    const refreshToken = appendRefreshToken(user);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    const userData = buildUserResponse(user);

    res.json({
      message: 'Email verified successfully',
      token,
      refreshToken,
      user: userData
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again.' 
      });
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    
    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshTokens = [];
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const tokenHash = hashRefreshToken(refreshToken);
    
    const user = await User.findOne({
      'refreshTokens.tokenHash': tokenHash,
      isActive: true
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const storedToken = user.refreshTokens.find(token => token.tokenHash === tokenHash);

    if (!storedToken || storedToken.expiresAt < new Date()) {
      user.refreshTokens = user.refreshTokens.filter(token => token.tokenHash !== tokenHash);
      await user.save();
      return res.status(401).json({ message: 'Expired refresh token' });
    }

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter(token => token.tokenHash !== tokenHash);
    const newRefreshToken = appendRefreshToken(user);
    await user.save();

    const token = generateToken(user._id);
    const userData = buildUserResponse(user);

    res.json({
      message: 'Token refreshed successfully',
      token,
      refreshToken: newRefreshToken,
      user: userData
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout - revoke refresh token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.json({ message: 'Logged out successfully' });
    }

    const tokenHash = hashRefreshToken(refreshToken);

    const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });

    if (user) {
      user.refreshTokens = user.refreshTokens.filter(token => token.tokenHash !== tokenHash);
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Change password (requires current password)
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request email change (sends OTP to new email)
router.post('/request-email-change', authenticate, [
  body('newEmail').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newEmail } = req.body;
    const user = await User.findById(req.user._id);

    // Check if new email is same as current
    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      return res.status(400).json({ message: 'New email must be different from current email' });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Generate OTP for email change
    const otp = generateOTP();
    user.emailChangeToken = otp;
    user.emailChangeExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    user.pendingEmail = newEmail.toLowerCase();
    await user.save();

    // Send verification email to new email
    const emailSent = await sendEmailVerificationOTP(newEmail, otp);
    
    if (!emailSent) {
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please try again.' 
      });
    }

    res.json({ message: 'Verification code sent to your new email address' });
  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email change (verifies OTP and updates email)
router.post('/verify-email-change', authenticate, [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    // Check if OTP is valid
    if (!user.emailChangeToken || user.emailChangeToken !== otp || 
        !user.emailChangeExpires || user.emailChangeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    if (!user.pendingEmail) {
      return res.status(400).json({ message: 'No pending email change request' });
    }

    // Check if email is still available
    const existingUser = await User.findOne({ email: user.pendingEmail });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Update email
    user.email = user.pendingEmail;
    user.isEmailVerified = true;
    user.emailChangeToken = null;
    user.emailChangeExpires = null;
    user.pendingEmail = null;
    await user.save();

    const userData = buildUserResponse(user);

    res.json({
      message: 'Email changed successfully',
      user: userData
    });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;