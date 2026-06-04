import cron from 'node-cron';
import webpush from 'web-push';
import User from '../models/User.js';
import { createInAppNotification } from './notificationService.js';
import { sendPushNotification } from './sendPushNotification.js';
import { buildPushPayload } from './pushPayload.js';

// Configure web push only if VAPID keys are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@writeanon.in'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const getDatePartsInTimeZone = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: Number(map.hour),
    minute: Number(map.minute),
    dateKey: `${map.year}-${map.month}-${map.day}`
  };
};

const getSafeTimeZone = (timeZone) => {
  const fallbackTimeZone = 'Asia/Kolkata';
  if (!timeZone) return fallbackTimeZone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return fallbackTimeZone;
  }
};

export const setupCronJobs = () => {
  // Send daily writing reminders frequently and match by user timezone.
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Checking for users to send writing reminders...');

      const now = new Date();

      // Find users who should receive reminders at this time
      const users = await User.find({
        'preferences.notifications': true,
        isActive: true
      });
      
      for (const user of users) {
        const reminderTime = user.preferences.reminderTime || '20:00';
        const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);

        const timezone = getSafeTimeZone(user.preferences?.timezone);
        const nowParts = getDatePartsInTimeZone(now, timezone);

        // Run within a 5-min window per user's local time.
        const isReminderWindow =
          nowParts.hour === reminderHour && Math.abs(nowParts.minute - reminderMinute) <= 4;

        if (!isReminderWindow) continue;

        const hasWrittenToday = user.lastWriteDate
          ? getDatePartsInTimeZone(new Date(user.lastWriteDate), timezone).dateKey === nowParts.dateKey
          : false;

        const alreadyRemindedToday = user.lastReminderSentAt
          ? getDatePartsInTimeZone(new Date(user.lastReminderSentAt), timezone).dateKey === nowParts.dateKey
          : false;

        if (!hasWrittenToday && !alreadyRemindedToday) {
          await createInAppNotification({
            userId: user._id,
            type: 'reminder',
            title: 'Time to Write',
            body: `Your words matter. Jot down a few lines today — you've got this.`,
            url: '/write'
          });

          await sendPushNotification(
            user._id,
            buildPushPayload({
              title: 'Time to Write',
              body: 'Your words matter. Open WriteAnon and share a thought today.',
              url: '/write',
              tag: `reminder-${nowParts.dateKey}`,
              type: 'reminder'
            })
          );

          user.lastReminderSentAt = new Date();
          await user.save();
          console.log(`Reminder sent to user ${user.username}`);
        }
      }
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });
  
  // Reset daily streaks at midnight (optional - streaks are calculated on write)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Running daily maintenance tasks...');
      
      // You can add daily maintenance tasks here
      // For example, cleaning up old chat messages, calculating daily stats, etc.
      
    } catch (error) {
      console.error('Error in daily maintenance cron job:', error);
    }
  });
  
  console.log('Cron jobs initialized');
};