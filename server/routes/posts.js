import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { sendPushNotification } from '../services/sendPushNotification.js';

const router = express.Router();

// Get all posts (public feed)
router.get('/', optionalAuth, async (req, res) => {
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
      authorId: post.authorId._id,
      authorName: post.isAnonymous ? 'Anonymous' : post.authorName,
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likes,
      likedBy: post.likedBy.map(id => id.toString()),
      comments: post.comments.map(comment => ({
        id: comment.id,
        postId: post._id,
        authorId: comment.authorId,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
        likes: comment.likes,
        likedBy: comment.likedBy.map(id => id.toString()),
        reactions: comment.reactions
      })),
      tags: post.tags,
      mood: post.mood,
      wordCount: post.wordCount
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
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});

// Get single post (for sharing)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'displayName username')
      .lean();
    
    if (!post || !post.isPublic || post.isDraft) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const transformedPost = {
      id: post._id,
      title: post.title,
      content: post.content,
      authorId: post.authorId._id,
      authorName: post.isAnonymous ? 'Anonymous' : post.authorName,
      isAnonymous: post.isAnonymous,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likes,
      likedBy: post.likedBy.map(id => id.toString()),
      comments: post.comments.map(comment => ({
        id: comment.id,
        postId: post._id,
        authorId: comment.authorId,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
        likes: comment.likes,
        likedBy: comment.likedBy.map(id => id.toString()),
        reactions: comment.reactions
      })),
      tags: post.tags,
      mood: post.mood,
      wordCount: post.wordCount
    };
    
    res.json({ post: transformedPost });
  } catch (error) {
    console.error('Get single post error:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
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

    // Create post data
    const postData = {
      title,
      content,
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
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const isLiked = post.likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      post.likedBy = post.likedBy.filter(id => !id.equals(userId));
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like
      post.likedBy.push(userId);
      post.likes += 1;
      // Send push notification to post author if not self-like
      if (post.authorId.toString() !== userId.toString()) {
        sendPushNotification(post.authorId, {
          title: 'Your post was liked!',
          body: `${req.user.displayName} liked your post.`,
          icon: '/icon-192x192.png',
          url: `/post/${post._id}`
        });
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

// Add comment to post
router.post('/:id/comments', authenticate, [
  body('content').isLength({ min: 1, max: 1000 }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = {
      authorId: req.user._id,
      authorName: req.user.displayName,
      content: req.body.content,
      likes: 0,
      likedBy: [],
      reactions: []
    };

    post.comments.push(comment);
    await post.save();

    // Get the newly created comment
    const newComment = post.comments[post.comments.length - 1];

    // Send push notification to post author if not self-comment
    if (post.authorId.toString() !== req.user._id.toString()) {
      sendPushNotification(post.authorId, {
        title: 'New comment on your post!',
        body: `${req.user.displayName} commented: ${req.body.content}`,
        icon: '/icon-192x192.png',
        url: `/post/${post._id}`
      });
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        id: newComment.id,
        postId: post._id,
        authorId: newComment.authorId,
        authorName: newComment.authorName,
        content: newComment.content,
        createdAt: newComment.createdAt,
        likes: newComment.likes,
        likedBy: [],
        reactions: []
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error while adding comment' });
  }
});

// Get user's posts
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
      likes: post.likes,
      likedBy: post.likedBy.map(id => id.toString()),
      comments: post.comments.map(comment => ({
        id: comment.id,
        postId: post._id,
        authorId: comment.authorId,
        authorName: comment.authorName,
        content: comment.content,
        createdAt: comment.createdAt,
        likes: comment.likes,
        likedBy: comment.likedBy.map(id => id.toString()),
        reactions: comment.reactions
      })),
      tags: post.tags,
      mood: post.mood,
      wordCount: post.wordCount,
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

export default router;