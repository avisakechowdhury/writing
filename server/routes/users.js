import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import { authenticate } from '../middleware/auth.js';
import { sendPushNotification } from '../services/sendPushNotification.js';

const router = express.Router();

// Get user stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const posts = await Post.find({ authorId: user._id });
    
    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    const averageWordCount = posts.length > 0 
      ? Math.round(posts.reduce((sum, post) => sum + post.wordCount, 0) / posts.length)
      : 0;
    
    // Calculate posts this week/month
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const postsThisWeek = posts.filter(post => post.createdAt >= weekAgo).length;
    const postsThisMonth = posts.filter(post => post.createdAt >= monthAgo).length;
    
    // Get writing days for calendar
    const writingDays = posts.map(post => post.createdAt.toISOString().split('T')[0]);
    const uniqueWritingDays = [...new Set(writingDays)];
    
    res.json({
      stats: {
        totalPosts: user.totalPosts,
        currentStreak: user.streak,
        totalLikes,
        totalComments,
        averageWordCount,
        postsThisWeek,
        postsThisMonth,
        points: user.points,
        level: user.level
      },
      writingDays: uniqueWritingDays
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user stats' });
  }
});

// Get user achievements
router.get('/achievements', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const posts = await Post.find({ authorId: user._id });
    
    // Define achievements
    const achievements = [
      {
        id: 'first_post',
        title: 'First Post',
        description: 'Published your first post',
        icon: '🎉',
        earned: user.totalPosts >= 1,
        earnedDate: user.totalPosts >= 1 ? posts[0]?.createdAt : null
      },
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Wrote for 7 consecutive days',
        icon: '🔥',
        earned: user.streak >= 7,
        earnedDate: user.streak >= 7 ? new Date() : null
      },
      {
        id: 'community_favorite',
        title: 'Community Favorite',
        description: 'Received 50+ likes on a single post',
        icon: '❤️',
        earned: posts.some(post => post.likes >= 50),
        earnedDate: posts.find(post => post.likes >= 50)?.createdAt || null
      },
      {
        id: 'consistency_king',
        title: 'Consistency King',
        description: 'Wrote for 30 consecutive days',
        icon: '👑',
        earned: user.streak >= 30,
        progress: Math.min(user.streak, 30)
      },
      {
        id: 'word_smith',
        title: 'Word Smith',
        description: 'Published 100 posts',
        icon: '📝',
        earned: user.totalPosts >= 100,
        progress: Math.min(user.totalPosts, 100)
      }
    ];
    
    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error while fetching achievements' });
  }
});

// Follow/unfollow user
router.post('/:id/follow', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => !id.equals(targetUserId));
      targetUser.followers = targetUser.followers.filter(id => !id.equals(currentUserId));
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      // Send push notification to followed user
      sendPushNotification(targetUserId, {
        title: 'New follower!',
        body: `${currentUser.displayName} started following you!`,
        icon: '/icon-192x192.png',
        url: `/profile/${currentUserId}`
      });
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length
    });
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ message: 'Server error while following/unfollowing user' });
  }
});

// Get user profile (public)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -pushSubscription')
      .populate('followers', 'displayName username')
      .populate('following', 'displayName username');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get only public posts for profile
    const posts = await Post.find({ 
      authorId: user._id, 
      isPublic: true,
      isDraft: false,
      isAnonymous: false // Don't show anonymous posts in public profile
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const isFollowing = req.user.following.includes(user._id);

    // Calculate public stats only
    const publicPostsCount = await Post.countDocuments({ 
      authorId: user._id, 
      isPublic: true,
      isDraft: false,
      isAnonymous: false
    });

    const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        streak: user.streak,
        level: user.level,
        totalPosts: publicPostsCount, // Only public posts
        joinedDate: user.createdAt,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
        totalLikes
      },
      posts: posts.map(post => ({
        id: post._id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        likes: post.likes,
        commentsCount: post.comments.length,
        mood: post.mood,
        tags: post.tags,
        wordCount: post.wordCount
      }))
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

export default router;