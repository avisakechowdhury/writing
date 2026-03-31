import express from 'express';
import webpush from 'web-push';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { createInAppNotification } from '../services/notificationService.js';

const router = express.Router();

// Configure web push only if VAPID keys are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@writeanon.in'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('Web push notifications configured');
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.');
}

// Subscribe to push notifications
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) {
      return res.status(400).json({ message: 'Push notifications not configured' });
    }

    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({ message: 'Subscription data required' });
    }
    
    // Save subscription to user
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription
    });
    
    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error while subscribing' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: null
    });
    
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ message: 'Server error while unsubscribing' });
  }
});

// Send test notification (daily reminder style)
router.post('/test', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    await createInAppNotification({
      userId: user._id,
      type: 'reminder',
      title: 'Time to Write! ✍️',
      body: `Keep your ${user.streak}-day streak alive! Share your thoughts with the community.`,
      url: '/write'
    });
    
    // Send a daily reminder-style notification
    const isPushConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

    if (!isPushConfigured) {
      return res.json({
        message: 'In-app reminder created. Push notifications are not configured on server yet.'
      });
    }

    if (!user.pushSubscription) {
      return res.json({
        message: 'In-app reminder created. Enable browser notifications to also receive push alerts.'
      });
    }

    const payload = JSON.stringify({
      title: 'Time to Write! ✍️',
      body: `Keep your ${user.streak}-day streak alive! Share your thoughts with the community.`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: {
        url: '/write'
      }
    });
    
    await webpush.sendNotification(user.pushSubscription, payload);
    
    res.json({ message: 'Test reminder notification sent successfully' });
  } catch (error) {
    console.error('Send test notification error:', error);
    
    if (error.statusCode === 410) {
      // Subscription expired, remove it
      await User.findByIdAndUpdate(req.user._id, {
        pushSubscription: null
      });
      return res.json({
        message: 'In-app reminder created. Push subscription expired, please re-enable notifications.'
      });
    }
    
    res.status(500).json({ message: 'Failed to send test notification. Please try again.' });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error while marking all notifications as read' });
  }
});

// Get in-app notifications list
router.get('/list', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'displayName username')
        .lean(),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications list error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
});

// Mark a notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
});

export default router;