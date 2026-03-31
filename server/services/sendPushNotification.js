import webpush from 'web-push';
import User from '../models/User.js';

const vapidEmail = process.env.VAPID_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@writeanon.in';

// Configure web push if VAPID keys are available
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      `mailto:${vapidEmail}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('Web push notifications configured');
  } catch (error) {
    console.error('Failed to configure web push:', error);
  }
} else {
  console.warn('VAPID keys not configured. Push notifications will not work.');
}

export async function sendPushNotification(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Push notifications will not work.');
    return false;
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      console.log(`User ${userId} has no push subscription`);
      return false;
    }

    // Ensure payload is properly formatted for the service worker.
    let formattedPayload = payload;
    if (typeof payload !== 'string' && payload && typeof payload === 'object') {
      const url = payload.url || payload?.data?.url || '/';
      formattedPayload = {
        title: payload.title || 'WriteAnon',
        body: payload.body || '',
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        data: payload.data || { url }
      };
    }

    const notificationPayload = typeof formattedPayload === 'string'
      ? formattedPayload
      : JSON.stringify(formattedPayload);
    
    try {
      await webpush.sendNotification(user.pushSubscription, notificationPayload);
      console.log(`Push notification sent successfully to user ${userId}`);
      return true;
    } catch (error) {
      console.error(`Error sending push notification to user ${userId}:`, error);
      
      // Handle specific error cases
      if (error.statusCode === 410) {
        // Subscription expired or no longer valid
        console.log(`Removing expired push subscription for user ${userId}`);
        await User.findByIdAndUpdate(userId, {
          pushSubscription: null
        });
      } else if (error.statusCode === 429) {
        // Too many requests
        console.warn(`Rate limit exceeded for push notifications to user ${userId}`);
      } else if (error.statusCode === 400) {
        // Invalid request
        console.error(`Invalid push notification request for user ${userId}:`, error.body);
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
} 