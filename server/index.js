import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import { authenticateSocket } from './middleware/auth.js';
import { setupCronJobs } from './services/cronJobs.js';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for auth endpoints in development
    return process.env.NODE_ENV === 'development' && req.path.startsWith('/api/auth');
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO for real-time features
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.username} connected`);
  
  // Join user to general chat room
  socket.join('general');
  
  // Join user to their personal room for direct messages
  socket.join(`user_${socket.userId}`);
  
  // Handle chat messages (public chat)
  socket.on('send_message', async (data) => {
    try {
      const message = {
        id: Date.now().toString(),
        userId: socket.userId,
        username: socket.username,
        content: data.content,
        timestamp: new Date(),
        room: data.room || 'general'
      };
      
      // Broadcast to room
      io.to(message.room).emit('receive_message', message);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle direct messages
  socket.on('send_direct_message', async (data) => {
    try {
      const { receiverId, content } = data;
      
      // Create conversation ID (consistent ordering)
      const conversationId = [socket.userId, receiverId].sort().join('-');
      
      // Save message to database
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content,
        conversationId
      });
      
      await message.save();
      await message.populate('senderId', 'displayName username avatar');
      await message.populate('receiverId', 'displayName username avatar');
      
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
      
      // Send to both users (sender and receiver)
      io.to(`user_${socket.userId}`).emit('receive_direct_message', messageData);
      io.to(`user_${receiverId}`).emit('receive_direct_message', messageData);
      
    } catch (error) {
      console.error('Direct message error:', error);
      socket.emit('error', { message: 'Failed to send direct message' });
    }
  });

  // Handle typing indicators for direct messages
  socket.on('typing_start', (data) => {
    socket.to(`user_${data.receiverId}`).emit('user_typing', {
      userId: socket.userId,
      username: socket.username
    });
  });

  socket.on('typing_stop', (data) => {
    socket.to(`user_${data.receiverId}`).emit('user_stopped_typing', {
      userId: socket.userId
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.username} disconnected`);
  });
});

// Setup cron jobs for notifications
setupCronJobs();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});