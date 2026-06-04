import webpush from 'web-push';
import User from '../models/User.js';
import { getPushBadgeUrl, getPushIconUrl } from '../config/push.js';

const vapidEmail = process.env.VAPID_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@writeanon.in';

const pushCooldownMs = 60 * 1000;
const recentPushByUser = new Map();

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
    return false;
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return false;
    }

    const dedupeKey = payload?.tag || payload?.data?.tag || payload?.data?.url || payload?.url;
    if (dedupeKey) {
      const userKey = userId.toString();
      const lastSent = recentPushByUser.get(`${userKey}:${dedupeKey}`);
      if (lastSent && Date.now() - lastSent < pushCooldownMs) {
        return false;
      }
      recentPushByUser.set(`${userKey}:${dedupeKey}`, Date.now());
    }

    let formattedPayload = payload;
    if (typeof payload !== 'string' && payload && typeof payload === 'object') {
      const url = payload.url || payload?.data?.url || '/';
      formattedPayload = {
        title: payload.title || 'WriteAnon',
        body: payload.body || '',
        icon: payload.icon || getPushIconUrl(),
        badge: payload.badge || getPushBadgeUrl(),
        tag: payload.tag || payload?.data?.tag || undefined,
        data: {
          ...(payload.data || {}),
          url
        }
      };
    }

    const notificationPayload = typeof formattedPayload === 'string'
      ? formattedPayload
      : JSON.stringify(formattedPayload);

    try {
      await webpush.sendNotification(user.pushSubscription, notificationPayload);
      return true;
    } catch (error) {
      console.error(`Error sending push notification to user ${userId}:`, error);

      if (error.statusCode === 410) {
        await User.findByIdAndUpdate(userId, {
          pushSubscription: null
        });
      }

      return false;
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
}
