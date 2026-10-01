import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { sendPushNotification } from '../services/sendPushNotification.js';
import { createInAppNotification } from '../services/notificationService.js';
import { isValidObjectId, sanitizeHTML } from '../utils/validation.js';
import {
  commentAuthorNameForUser,
  transformComment
} from '../utils/commentDisplay.js';
import { buildPushPayload } from '../services/pushPayload.js';

const router = express.Router();

// Middleware to log all requests to posts routes
router.use((req, res, next) => {
  // console.log('Posts route accessed:', {
  //   method: req.method,
  //   url: req.url,
  //   path: req.path,
  //   params: req.params,
  //   query: req.query,
  //   userAgent: req.get('User-Agent'),
  //   ip: req.ip,
  //   timestamp: new Date().toISOString()
  // });
  next();
});

// Get all posts (public feed)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, mood, tags } = req.query;
    
    // Build query
    const query = { isPublic: true, isDraft: false };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (mood && mood !== 'all') {
      query.mood = mood;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'displayName username')
      .lean();
    
    // Transform posts for frontend
    const transformedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      authorId: post.authorId?._id || post.authorId,
      authorName: post.isAnonymous ? 'Anonymous' : (post.authorId?.displayName || post.authorName),
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      contentEditedAt: post.contentEditedAt || null,
      likes: post.likes || 0,
      likedBy: (post.likedBy || []).map(id => id.toString()),
      comments: (post.comments || []).map((comment) => transformComment(post, comment)).filter(Boolean),
      tags: post.tags || [],
      mood: post.mood,
      wordCount: post.wordCount || 0
    }));
    
    const total = await Post.countDocuments(query);
    
    res.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while fetching posts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's posts — MUST be before /:id to avoid treating 'my-posts' as a post ID
router.get('/my-posts', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ authorId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const transformedPosts = posts.map(post => ({
      id: post._id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      contentEditedAt: post.contentEditedAt || null,
      likes: post.likes || 0,
      likedBy: (post.likedBy || []).map(id => id.toString()),
      comments: (post.comments || []).map((comment) => transformComment(post, comment)).filter(Boolean),
      tags: post.tags || [],
      mood: post.mood,
      wordCount: post.wordCount || 0,
      isDraft: post.isDraft
    }));

    const total = await Post.countDocuments({ authorId: req.user._id });

    res.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error while fetching user posts' });
  }
});

// Get single post (for sharing)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Log the incoming request for debugging
    // console.log('Get single post request:', { id, url: req.url, userAgent: req.get('User-Agent') });
    
    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      console.log('Invalid post ID format:', id);
      return res.status(400).json({ message: 'Invalid post ID format' });
    }
    
    const post = await Post.findById(id)
      .populate('authorId', 'displayName username')
      .lean();
    
    if (!post || !post.isPublic || post.isDraft) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Generate preview content for social sharing
    const previewContent = post.content.replace(/<[^>]*>/g, '').substring(0, 200);
    
    const transformedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      preview: previewContent,
      authorId: post.authorId?._id || post.authorId,
      authorName: post.isAnonymous ? 'Anonymous' : (post.authorId?.displayName || post.authorName),
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      contentEditedAt: post.contentEditedAt || null,
      likes: post.likes || 0,
      likedBy: (post.likedBy || []).map(id => id.toString()),
      comments: (post.comments || []).map((comment) => transformComment(post, comment)).filter(Boolean),
      tags: post.tags || [],
      mood: post.mood,
      wordCount: post.wordCount || 0
    };
    
    res.json({ post: transformedPost });
  } catch (error) {
    console.error('Get single post error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while fetching post',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

const POST_EDIT_WINDOW_MS = 60 * 60 * 1000;

// Update post (author only, within 1 hour of original publish time)
router.put('/:id', authenticate, [
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('content').isLength({ min: 1, max: 10000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    if (post.isDraft) {
      return res.status(400).json({ message: 'Draft posts cannot be updated through this action' });
    }

    const created = new Date(post.createdAt).getTime();
    if (Date.now() - created > POST_EDIT_WINDOW_MS) {
      return res.status(403).json({
        message: 'Editing is only allowed within one hour of posting'
      });
    }

    const safeContent = sanitizeHTML(req.body.content);
    post.title = req.body.title.trim();
    post.content = safeContent;
    post.contentEditedAt = new Date();
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('authorId', 'displayName username')
      .lean();

    const transformedPost = {
      id: populated._id,
      title: populated.title,
      content: populated.content,
      authorId: populated.authorId?._id || populated.authorId,
      authorName: populated.isAnonymous ? 'Anonymous' : (populated.authorId?.displayName || populated.authorName),
      isAnonymous: populated.isAnonymous,
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt,
      contentEditedAt: populated.contentEditedAt || null,
      likes: populated.likes || 0,
      likedBy: (populated.likedBy || []).map((uid) => uid.toString()),
      comments: (populated.comments || []).map((comment) => transformComment(populated, comment)).filter(Boolean),
      tags: populated.tags || [],
      mood: populated.mood,
      wordCount: populated.wordCount || 0
    };

    res.json({
      message: 'Post updated successfully',
      post: transformedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error while updating post' });
  }
});

// Create new post
router.post('/', authenticate, [
  body('title').isLength({ min: 1, max: 200 }).trim(),
  body('content').isLength({ min: 1, max: 10000 }),
  body('isAnonymous').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('mood').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) {
      return true;
    }
    return ['happy', 'sad', 'anxious', 'grateful', 'peaceful', 'excited', 'thoughtful', 'frustrated'].includes(value);
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, isAnonymous = false, tags = [], mood, isDraft = false } = req.body;

    const safeContent = sanitizeHTML(content);

    // Create post data
    const postData = {
      title,
      content: safeContent,
      authorId: req.user._id,
      authorName: isAnonymous ? 'Anonymous' : req.user.displayName,
      isAnonymous,
      tags: tags.map(tag => tag.toLowerCase().trim()),
      isDraft
    };

    // Only add mood if it's provided and not empty
    if (mood && mood.trim() !== '' && mood !== 'undefined' && mood !== 'null') {
      postData.mood = mood;
    } else {
      // Explicitly remove mood field if not provided
      delete postData.mood;
    }

    console.log('Creating post with data:', postData);

    const post = new Post(postData);
    await post.save();

    // Update user stats if not a draft
    if (!isDraft) {
      const user = req.user;
      
      // Check if user has written today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastWrite = user.lastWriteDate ? new Date(user.lastWriteDate) : null;
      
      if (!lastWrite || lastWrite < today) {
        user.updateStreak();
        user.points += 10; // 10 points per post
        user.totalPosts += 1;
        user.updateLevel();
        await user.save();
      }
    }

    // Transform post for response
    const transformedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      authorId: post.authorId,
      authorName: post.authorName,
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      contentEditedAt: post.contentEditedAt || null,
      likes: post.likes,
      likedBy: [],
      comments: [],
      tags: post.tags,
      mood: post.mood,
      wordCount: post.wordCount
    };

    res.status(201).json({
      message: 'Post created successfully',
      post: transformedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error while creating post' });
  }
});

// Like/unlike post
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }
    
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    post.likedBy = post.likedBy || [];
    const isLiked = post.likedBy.some(id => (id?.toString?.() ?? id) === userId.toString());

    if (isLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => (id?.toString?.() ?? id) !== userId.toString());
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      // Like
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
      // Send push notification to post author if not self-like
      if (post.authorId.toString() !== userId.toString()) {
        await createInAppNotification({
          userId: post.authorId,
          actorId: userId,
          type: 'like',
          title: 'Your post got a new like',
          body: `${req.user.displayName} liked your post "${post.title}"`,
          url: `/post/${post._id}`
        });
        sendPushNotification(
          post.authorId,
          buildPushPayload({
            title: 'Your post was liked!',
            body: `${req.user.displayName} liked your post.`,
            url: `/post/${post._id}`,
            tag: `like-${post._id}`,
            type: 'like'
          })
        );
      }
    }

    await post.save();

    res.json({
      message: isLiked ? 'Post unliked' : 'Post liked',
      likes: post.likes,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error while liking post' });
  }
});

// Add comment to post (optional parentId for replies)
router.post('/:id/comments', authenticate, [
  body('content').isLength({ min: 1, max: 5000 }).trim(),
  body('parentId').optional().isString().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { parentId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (parentId) {
      const parent = post.comments.find((c) => c.id === parentId);
      if (!parent) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }
    }

    const safeComment = sanitizeHTML(req.body.content);
    const plainForPush = safeComment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
    const displayName = commentAuthorNameForUser(post, req.user._id, req.user.displayName);

    const comment = {
      authorId: req.user._id,
      authorName: displayName,
      content: safeComment,
      parentId: parentId || null,
      likes: 0,
      likedBy: [],
      reactions: []
    };

    post.comments.push(comment);
    await post.save();

    const newComment = post.comments[post.comments.length - 1];
    const transformed = transformComment(post, newComment);

    if (post.authorId.toString() !== req.user._id.toString()) {
      const replyLabel = parentId ? 'replied to a comment on' : 'commented on';
      await createInAppNotification({
        userId: post.authorId,
        actorId: req.user._id,
        type: 'comment',
        title: parentId ? 'New reply on your post' : 'New comment on your post',
        body: `${displayName} ${replyLabel} "${post.title}"`,
        url: `/post/${post._id}`
      });
      sendPushNotification(
        post.authorId,
        buildPushPayload({
          title: parentId ? 'New reply on your post' : 'New comment on your post!',
          body: `${displayName}: ${plainForPush || 'New comment'}`,
          url: `/post/${post._id}`,
          tag: `comment-${post._id}-${req.user._id}`,
          type: 'comment'
        })
      );
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: transformed
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// Like/unlike comment
router.post('/:postId/comments/:commentId/like', authenticate, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (!isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }
    if (!commentId || !/^[0-9a-fA-F]{24}$/.test(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID format' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find(comment => comment.id === commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user._id;
    comment.likedBy = comment.likedBy || [];
    const hasLiked = comment.likedBy.some(id => (id?.toString?.() ?? id) === userId.toString());

    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter(id => (id?.toString?.() ?? id) !== userId.toString());
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes = (comment.likes || 0) + 1;
    }

    await post.save();

    res.json({
      message: hasLiked ? 'Comment unliked' : 'Comment liked',
      likes: comment.likes,
      isLiked: !hasLiked
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error while updating comment like' });
  }
});

// (my-posts route moved above /:id to prevent Express from matching 'my-posts' as a post ID)

// Catch-all route for invalid post requests
router.get('*', (req, res) => {
  console.log('Invalid post route accessed:', req.url);
  res.status(404).json({ message: 'Post route not found' });
});

export default router;