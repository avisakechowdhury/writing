import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get conversations list
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all conversations where user is sender or receiver
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.senderId.equals(userId) 
          ? conv.lastMessage.receiverId 
          : conv.lastMessage.senderId;
        
        const otherUser = await User.findById(otherUserId).select('displayName username avatar');
        
        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({ conversations: populatedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
});

// Get messages for a conversation
router.get('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;
    const { page = 1, limit = 50 } = req.query;
    
    // Create conversation ID (consistent ordering)
    const conversationId = [currentUserId, otherUserId].sort().join('-');
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'displayName username avatar')
      .populate('receiverId', 'displayName username avatar')
      .lean();
    
    // Mark messages as read
    await Message.updateMany(
      { 
        conversationId,
        receiverId: currentUserId,
        isRead: false
      },
      { isRead: true }
    );
    
    res.json({ 
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// Send message
router.post('/send', authenticate, [
  body('receiverId').isMongoId().withMessage('Valid receiver ID required'),
  body('content').isLength({ min: 1, max: 1000 }).trim().withMessage('Message content required (1-1000 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create conversation ID (consistent ordering)
    const conversationId = [senderId, receiverId].sort().join('-');

    const message = new Message({
      senderId,
      receiverId,
      content,
      conversationId
    });

    await message.save();
    
    // Populate sender details
    await message.populate('senderId', 'displayName username avatar');
    await message.populate('receiverId', 'displayName username avatar');

    // Emit socket event to both users
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        id: message._id,
        senderId: message.senderId._id,
        receiverId: message.receiverId._id,
        content: message.content,
        timestamp: message.createdAt,
        conversationId: message.conversationId,
        sender: {
          id: message.senderId._id,
          displayName: message.senderId.displayName,
          username: message.senderId.username,
          avatar: message.senderId.avatar
        }
      };
      
      io.to(`user_${senderId}`).emit('receive_direct_message', messageData);
      io.to(`user_${receiverId}`).emit('receive_direct_message', messageData);
    }
    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// Mark messages as read
router.put('/read/:conversationId', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { 
        conversationId,
        receiverId: userId,
        isRead: false
      },
      { isRead: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error while marking messages as read' });
  }
});

export default router;