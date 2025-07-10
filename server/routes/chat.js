import express from 'express';
import ChatMessage from '../models/ChatMessage.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get chat messages
router.get('/messages', authenticate, async (req, res) => {
  try {
    const { room = 'general', page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await ChatMessage.find({ room })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'displayName username')
      .lean();
    
    const transformedMessages = messages.reverse().map(message => ({
      id: message._id,
      userId: message.userId._id,
      username: message.username,
      content: message.content,
      timestamp: message.createdAt,
      room: message.room,
      isSystem: message.isSystem
    }));
    
    res.json({ messages: transformedMessages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error while fetching chat messages' });
  }
});

// Save chat message (called by socket handler)
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { content, room = 'general' } = req.body;
    
    const message = new ChatMessage({
      userId: req.user._id,
      username: req.user.displayName,
      content,
      room
    });
    
    await message.save();
    
    res.status(201).json({
      message: 'Message saved successfully',
      data: {
        id: message._id,
        userId: message.userId,
        username: message.username,
        content: message.content,
        timestamp: message.createdAt,
        room: message.room
      }
    });
  } catch (error) {
    console.error('Save chat message error:', error);
    res.status(500).json({ message: 'Server error while saving chat message' });
  }
});

export default router;