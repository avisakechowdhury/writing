import webpush from 'web-push';
import User from '../models/User.js';

export async function sendPushNotification(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured. Push notifications will not work.');
    return;
  }

  const user = await User.findById(userId);
  if (!user || !user.pushSubscription) return;

  try {
    await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
} 