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
import randomChatRoutes from './routes/randomChat.js';
import reportRoutes from './routes/reports.js';
import { authenticateSocket } from './middleware/auth.js';
import { setupCronJobs } from './services/cronJobs.js';
import Message from './models/Message.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { sanitizeHTML } from './utils/validation.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

// -------------------------------------------------------------
// 1. CENTRALIZED URL PARSING (The Fix)
// -------------------------------------------------------------
// Split the comma-separated string into a clean array of URLs
const clientUrls = (process.env.CLIENT_URL || "")
  .split(",")
  .map(url => url.trim())
  .filter(url => url.length > 0);

// Default fallback if env var is empty
if (clientUrls.length === 0) {
  clientUrls.push("http://localhost:5173");
}

// Add static origins that should always be allowed
const allAllowedOrigins = [
  ...clientUrls,
  "https://anonwriter.vercel.app",
  "https://www.writeanon.in",
  "https://writeanon.in",
  "http://localhost:5173"
];

// Remove duplicates using Set
const uniqueOrigins = [...new Set(allAllowedOrigins)];
// -------------------------------------------------------------

const server = createServer(app);
const io = new Server(server, {
  cors: {
    // ✅ FIXED: Using the array instead of raw string
    origin: uniqueOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

// Connect to MongoDB
connectDB();

// Enhanced Helmet configuration for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      // ✅ FIXED: Spreading the array correctly
      connectSrc: ["'self'", ...uniqueOrigins],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (uniqueOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count"]
}));

// Rate limiting - stricter for auth endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => {
    return req.path.startsWith('/api/auth') || req.path.startsWith('/api/health');
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Stricter for auth
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use(generalLimiter);
app.use('/api/auth', authLimiter);

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Prevent JSON parsing errors from crashing the server
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON payload' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(sanitizeInput);

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/random-chat', randomChatRoutes);
app.use('/api/reports', reportRoutes);

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
      // Validate and sanitize input
      if (!data || typeof data.content !== 'string' || data.content.trim().length === 0) {
        return socket.emit('error', { message: 'Invalid message content' });
      }

      if (data.content.length > 1000) {
        return socket.emit('error', { message: 'Message too long (max 1000 characters)' });
      }

      const sanitizedContent = sanitizeHTML(data.content.trim());

      const message = {
        id: Date.now().toString(),
        userId: socket.userId,
        username: socket.username,
        content: sanitizedContent,
        timestamp: new Date(),
        room: (data.room && typeof data.room === 'string') ? data.room.replace(/[^a-zA-Z0-9_-]/g, '') : 'general'
      };
      
      // Broadcast to room
      io.to(message.room).emit('receive_message', message);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle direct messages
  socket.on('send_direct_message', async (data) => {
    try {
      // Validate input
      if (!data || !data.receiverId || !data.content) {
        return socket.emit('error', { message: 'Invalid message data' });
      }

      const { receiverId, content } = data;
      
      // Validate receiverId format (MongoDB ObjectId)
      if (!/^[0-9a-fA-F]{24}$/.test(receiverId)) {
        return socket.emit('error', { message: 'Invalid receiver ID' });
      }

      // Validate and sanitize content
      if (typeof content !== 'string' || content.trim().length === 0) {
        return socket.emit('error', { message: 'Invalid message content' });
      }

      if (content.length > 5000) {
        return socket.emit('error', { message: 'Message too long (max 5000 characters)' });
      }

      const sanitizedContent = sanitizeHTML(content.trim());
      
      // Prevent self-messaging abuse
      if (receiverId === socket.userId) {
        return socket.emit('error', { message: 'Cannot send message to yourself' });
      }
      
      // Create conversation ID (consistent ordering)
      const conversationId = [socket.userId, receiverId].sort().join('-');
      
      // Save message to database
      const message = new Message({
        senderId: socket.userId,
        receiverId,
        content: sanitizedContent,
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

  // Handle random chat events
  socket.on('join_random_chat', (data) => {
    socket.join(`random_chat_${data.sessionId}`);
  });

  socket.on('leave_random_chat', (data) => {
    socket.leave(`random_chat_${data.sessionId}`);
  });

  socket.on('random_chat_typing_start', (data) => {
    socket.to(`random_chat_${data.sessionId}`).emit('random_chat_typing', {
      userId: socket.userId,
      sessionId: data.sessionId
    });
  });

  socket.on('random_chat_typing_stop', (data) => {
    socket.to(`random_chat_${data.sessionId}`).emit('random_chat_stopped_typing', {
      userId: socket.userId,
      sessionId: data.sessionId
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
  // Log error details server-side only
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't expose error details in production
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Something went wrong. Please try again later.';

  res.status(statusCode).json({ 
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
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