import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import RandomChat from '../models/RandomChat.js';
import User from '../models/User.js';

const router = express.Router();

// Start searching for a random chat partner
router.post('/search', authenticate, [
  body('topic').isIn(['general', 'books', 'movies', 'music', 'technology', 'travel', 'food', 'sports', 'art', 'philosophy']),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { topic, isAnonymous = true } = req.body;
    const userId = req.user._id;

    // Check if user is already in a chat
    const existingChat = await RandomChat.findOne({
      'participants.userId': userId,
      status: { $in: ['searching', 'active'] }
    });

    if (existingChat) {

      if (existingChat.status === 'searching') {
        return res.json({
          message: 'Already searching for a partner...',
          sessionId: existingChat.sessionId,
          status: 'searching'
        });
      }
      // FIX: Check for and handle stale sessions
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (existingChat.updatedAt < twoMinutesAgo) {
        // Session is stale, end it and allow user to proceed.
        existingChat.status = 'ended';
        existingChat.endedAt = new Date();
        await existingChat.save();
        // Continue to the search logic below
      } else {
        // Session is recent, so it's a legitimate "already in chat" error.
        return res.status(400).json({
          message: 'You are already in a chat session',
          sessionId: existingChat.sessionId
        });
      }
    }


    // Look for an available partner with the same topic
    let partnerChat = await RandomChat.findOne({
      topic,
      status: 'searching',
      'participants.userId': { $ne: userId },
      'participants.0.userId': { $exists: true },
      'participants.1.userId': { $exists: false }
    });

    let isFallbackMatch = false;

    if (!partnerChat) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      partnerChat = await RandomChat.findOne({
        status: 'searching',
        'participants.userId': { $ne: userId },
        'participants.0.userId': { $exists: true },
        'participants.1.userId': { $exists: false },
        startedAt: { $lt: oneMinuteAgo } // Key change: find chats older than 1 minute
      });
      if (partnerChat) {
        isFallbackMatch = true;
      }
    }

    if (partnerChat) {
      // Found a partner, join their chat
      partnerChat.participants.push({ userId, isAnonymous, joinedAt: new Date() });
      partnerChat.status = 'active';

      // Add custom system message for fallback matches
      let systemMessageContent = 'Partner found! Say hello! 👋';
      if (isFallbackMatch) {
        systemMessageContent = `We couldn't find anyone for your topic, so we connected you with someone interested in "${partnerChat.topic}". Say hello! 👋`;
      }

      partnerChat.messages.push({
        content: systemMessageContent,
        timestamp: new Date(),
        isSystem: true
      });

      await partnerChat.save();


      // Notify both users via socket
      const io = req.app.get('io');
      if (io) {
        // Notify the original user
        io.to(`user_${partnerChat.participants[0].userId}`).emit('partner_found', {
          sessionId: partnerChat.sessionId,
          partner: {
            id: userId,
            isAnonymous: true
          }
        });

        // Notify the new user
        io.to(`user_${userId}`).emit('partner_found', {
          sessionId: partnerChat.sessionId,
          partner: {
            id: partnerChat.participants[0].userId,
            isAnonymous: true
          }
        });
      }

      return res.json({
        message: 'Partner found!',
        sessionId: partnerChat.sessionId,
        status: 'active',
        partner: {
          id: partnerChat.participants[0].userId,
          isAnonymous: true
        }
      });
    }

    // No partner found, create a new searching session
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = new RandomChat({
      sessionId,
      participants: [{ userId, isAnonymous, joinedAt: new Date() }],
      topic,
      status: 'searching',
      isAnonymous,
      startedAt: new Date(), // Make sure startedAt is set
      messages: [{
        content: `Looking for someone interested in ${topic}...`,
        timestamp: new Date(),
        isSystem: true
      }]
    });

    await newChat.save();

    res.json({
      message: 'Searching for a partner...',
      sessionId: newChat.sessionId,
      status: 'searching'
    });

  } catch (error) {
    console.error('Random chat search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat session details
router.get('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const chat = await RandomChat.findOne({
      sessionId,
      'participants.userId': userId
    }).populate('participants.userId', 'displayName username avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Get partner info (excluding current user)
    const partner = chat.participants.find(p => p.userId._id.toString() !== userId.toString());

    res.json({
      sessionId: chat.sessionId,
      status: chat.status,
      topic: chat.topic,
      isAnonymous: chat.isAnonymous,
      messages: chat.messages,
      partner: partner ? {
        id: partner.userId._id,
        name: 'Anonymous', // Always anonymous
        isAnonymous: true
      } : null,
      startedAt: chat.startedAt
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message in random chat
router.post('/message', authenticate, [
  body('sessionId').notEmpty(),
  body('content').isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, content } = req.body;
    const userId = req.user._id;

    const chat = await RandomChat.findOne({
      sessionId,
      'participants.userId': userId,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found or not active' });
    }

    // Add message to chat
    chat.messages.push({
      senderId: userId,
      content,
      timestamp: new Date()
    });

    await chat.save();

    // Emit to socket for real-time updates
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participant => {
        if (participant.userId.toString() !== userId.toString()) {
          io.to(`user_${participant.userId}`).emit('random_chat_message', {
            sessionId,
            message: {
              senderId: userId,
              content,
              timestamp: new Date()
            }
          });
        }
      });
    }

    res.json({ message: 'Message sent successfully' });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// End chat session
router.post('/end', authenticate, [
  body('sessionId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.body;
    const userId = req.user._id;

    const chat = await RandomChat.findOne({
      sessionId,
      'participants.userId': userId,
      status: { $in: ['searching', 'active'] }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    // The original status is needed to decide if we should notify a partner
    const originalStatus = chat.status;

    // Mark the chat as ended regardless of its original state
    chat.status = 'ended';
    chat.endedAt = new Date();
    // Mark user as left
    const participant = chat.participants.find(p => p.userId.toString() === userId.toString());
    if (participant) {
      participant.leftAt = new Date();
    }

    // Only add a system message and notify partner if the chat was actually active
    if (originalStatus === 'active') {
      chat.messages.push({
        content: 'Chat ended.',
        timestamp: new Date(),
        isSystem: true
      });


      // Notify other participants
      const io = req.app.get('io');
      if (io) {
        chat.participants.forEach(p => {
          if (p.userId.toString() !== userId.toString()) {
            io.to(`user_${p.userId}`).emit('random_chat_ended', {
              sessionId,
              message: 'Your chat partner has left the conversation.'
            });
          }
        });
      }
    }

    await chat.save();
    res.json({ message: 'Chat ended successfully' });

  } catch (error) {
    console.error('End chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Skip current partner and find new one
router.post('/skip', authenticate, [
  body('sessionId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.body;
    const userId = req.user._id;

    const chat = await RandomChat.findOne({
      sessionId,
      'participants.userId': userId,
      status: 'active'
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // End current chat
    chat.status = 'ended';
    chat.endedAt = new Date();
    chat.messages.push({
      content: 'Chat ended - partner skipped.',
      timestamp: new Date(),
      isSystem: true
    });

    await chat.save();

    // Notify other participant
    const partner = chat.participants.find(p => p.userId.toString() !== userId.toString());
    if (partner) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${partner.userId}`).emit('random_chat_ended', {
          sessionId,
          message: 'Your chat partner has left the conversation.'
        });
      }
    }

    // Start new search
    const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat = new RandomChat({
      sessionId: newSessionId,
      participants: [{
        userId,
        isAnonymous: true,
        joinedAt: new Date()
      }],
      topic: chat.topic,
      status: 'searching',
      isAnonymous: true,
      messages: [{
        content: `Looking for a new partner interested in ${chat.topic}...`,
        timestamp: new Date(),
        isSystem: true
      }]
    });

    await newChat.save();

    res.json({
      message: 'Skipped partner, searching for new one...',
      sessionId: newChat.sessionId,
      status: 'searching'
    });

  } catch (error) {
    console.error('Skip partner error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report user in chat
router.post('/report', authenticate, [
  body('sessionId').notEmpty(),
  body('reason').isIn(['spam', 'inappropriate_content', 'harassment', 'hate_speech', 'violence', 'other']),
  body('description').isLength({ min: 10, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, reason, description } = req.body;
    const reporterId = req.user._id;

    const chat = await RandomChat.findOne({
      sessionId,
      'participants.userId': userId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }
    if (chat.status === 'ended') {
      return res.json({ message: 'Chat already ended' }); // 200 OK
    }

    // Find the other participant (reported user)
    const reportedUser = chat.participants.find(p => p.userId.toString() !== reporterId.toString());

    if (!reportedUser) {
      return res.status(400).json({ message: 'No other participant found to report' });
    }

    // Create report (you'll need to implement the Report model)
    // For now, just log it
    console.log(`User ${reporterId} reported user ${reportedUser.userId} in chat ${sessionId} for ${reason}: ${description}`);

    res.json({ message: 'Report submitted successfully' });

  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;