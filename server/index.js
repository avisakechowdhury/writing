import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import userRoutes from './routes/users.js';
import chatRoutes from './routes/chat.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import randomChatRoutes from './routes/randomChat.js';
import reportRoutes from './routes/reports.js';
import Post from './models/Post.js';
import { authenticateSocket } from './middleware/auth.js';
import { setupCronJobs } from './services/cronJobs.js';
import Message from './models/Message.js';
import { createInAppNotification } from './services/notificationService.js';
import { sendPushNotification } from './services/sendPushNotification.js';
import { buildPushPayload } from './services/pushPayload.js';
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
const staticOrigins = [
  "https://anonwriter.vercel.app",
  "https://www.writeanon.in",
  "https://writeanon.in",
  "http://localhost:5173"
];

// Combine and auto-generate www/non-www variants for every origin
const allAllowedOrigins = [...clientUrls, ...staticOrigins];

// For each origin, ensure both www and non-www variants exist
const expandedOrigins = new Set();
allAllowedOrigins.forEach(url => {
  expandedOrigins.add(url);
  try {
    const parsed = new URL(url);
    if (parsed.hostname.startsWith('www.')) {
      // Add non-www variant
      parsed.hostname = parsed.hostname.replace(/^www\./, '');
      expandedOrigins.add(parsed.origin);
    } else if (!parsed.hostname.includes('localhost')) {
      // Add www variant
      parsed.hostname = `www.${parsed.hostname}`;
      expandedOrigins.add(parsed.origin);
    }
  } catch {
    // Skip invalid URLs
  }
});

// Remove duplicates using Set
const uniqueOrigins = [...expandedOrigins];

// Log allowed origins at startup for debugging
console.log('Allowed CORS origins:', uniqueOrigins);
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
const cspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  scriptSrc: ["'self'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", ...uniqueOrigins],
  frameSrc: ["'none'"],
  objectSrc: ["'none'"]
};

// Only add upgradeInsecureRequests in production (null is not valid)
if (process.env.NODE_ENV === 'production') {
  cspDirectives.upgradeInsecureRequests = [];
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: cspDirectives
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Enable HSTS in production (tell browsers to always use HTTPS)
  strictTransportSecurity: process.env.NODE_ENV === 'production'
    ? { maxAge: 63072000, includeSubDomains: true, preload: true }
    : false,
  // Prevent MIME type sniffing
  xContentTypeOptions: true,
  // Prevent clickjacking
  xFrameOptions: { action: 'sameorigin' },
  // Prevent cross-domain policy file requests
  xPermittedCrossDomainPolicies: { permittedPolicies: 'none' }
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

// Block API routes (except health and SEO) when the database is down
app.use((req, res, next) => {
  if (req.path === '/api/health' || req.path.startsWith('/api/seo') || !req.path.startsWith('/api')) return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database is currently unavailable. If using MongoDB Atlas, please ensure your current IP address is whitelisted in MongoDB Atlas Network Access (or 0.0.0.0/0 for development).',
      code: 'DATABASE_UNAVAILABLE'
    });
  }
  next();
});

// Prevent search engines from indexing API responses
app.use('/api', (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

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

// Public SEO metadata for posts (used by share previews and crawlers)
app.get('/api/seo/post/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findById(id)
      .select('title content isAnonymous authorName tags wordCount createdAt updatedAt isPublic isDraft')
      .lean();

    if (!post || !post.isPublic || post.isDraft) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const baseUrl = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'https://writeanon.in';
    const plain = (post.content || '').replace(/<[^>]*>/g, '').trim();
    const description = plain.substring(0, 160) || 'Read this post on WriteAnon';
    const authorName = post.isAnonymous ? 'Anonymous' : post.authorName;

    res.json({
      title: `${post.title} | WriteAnon`,
      description,
      canonical: `${baseUrl}/post/${id}`,
      authorName,
      tags: post.tags || [],
      wordCount: post.wordCount || 0,
      publishedAt: post.createdAt,
      modifiedAt: post.updatedAt,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        url: `${baseUrl}/post/${id}`,
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
        author: { '@type': 'Person', name: authorName },
        publisher: {
          '@type': 'Organization',
          name: 'WriteAnon',
          logo: { '@type': 'ImageObject', url: `${baseUrl}/logo.png` }
        },
        keywords: (post.tags || []).join(', ')
      }
    });
  } catch (error) {
    console.error('SEO post metadata error:', error);
    res.status(500).json({ message: 'Failed to load SEO metadata' });
  }
});

// Health check — always returns 200 so the frontend can distinguish
// "server alive, DB down" from "server unreachable".
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbConnected = dbState === 1;

  res.status(200).json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    database: dbStates[dbState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Dynamic sitemap generation for SEO
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'https://writeanon.in';
    
    // Get recent public posts (last 1000 for sitemap)
    const recentPosts = await Post.find({ 
      isPublic: true, 
      isDraft: false 
    })
      .sort({ createdAt: -1 })
      .limit(1000)
      .select('_id updatedAt')
      .lean();
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/landing</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/write</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/random-chat</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/connect</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    
    // Add individual post URLs
    recentPosts.forEach(post => {
      const lastmod = post.updatedAt ? new Date(post.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}/post/${post._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return basic sitemap on error
    res.set('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.CLIENT_URL?.split(',')[0]?.trim() || 'https://writeanon.in'}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  }
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

      if (receiverId !== socket.userId) {
        const senderName = message.senderId?.displayName || socket.username;
        await createInAppNotification({
          userId: receiverId,
          actorId: socket.userId,
          type: 'message',
          title: 'New direct message',
          body: `${senderName} sent you a message.`,
          url: `/messages/${socket.userId}`
        });
        sendPushNotification(
          receiverId,
          buildPushPayload({
            title: 'New message',
            body: `${senderName}: ${sanitizedContent.substring(0, 80)}`,
            url: `/messages/${socket.userId}`,
            tag: `dm-${conversationId}`,
            type: 'message'
          })
        );
      }
      
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