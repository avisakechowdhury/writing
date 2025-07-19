import express from 'express';
import webpush from 'web-push';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure web push only if VAPID keys are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
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

// Send test notification
router.post('/test', authenticate, async (req, res) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY) {
      return res.status(400).json({ message: 'Push notifications not configured on server' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.pushSubscription) {
      return res.status(400).json({ message: 'Please enable push notifications first' });
    }
    
    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test notification from DailyWrite!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    });
    
    await webpush.sendNotification(user.pushSubscription, payload);
    
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Send test notification error:', error);
    
    if (error.statusCode === 410) {
      // Subscription expired, remove it
      await User.findByIdAndUpdate(req.user._id, {
        pushSubscription: null
      });
      return res.status(400).json({ message: 'Push subscription expired. Please re-enable notifications.' });
    }
    
    res.status(500).json({ message: 'Failed to send test notification. Please try again.' });
  }
});

export default router;