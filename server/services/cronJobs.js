import cron from 'node-cron';
import webpush from 'web-push';
import User from '../models/User.js';

// Configure web push only if VAPID keys are provided
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const setupCronJobs = () => {
  // Send daily writing reminders (runs every hour to check for users)
  cron.schedule('0 * * * *', async () => {
    try {
      // Skip if VAPID keys not configured
      if (!process.env.VAPID_PUBLIC_KEY) {
        return;
      }

      console.log('Checking for users to send writing reminders...');
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Find users who should receive reminders at this time
      const users = await User.find({
        'preferences.notifications': true,
        pushSubscription: { $ne: null },
        isActive: true
      });
      
      for (const user of users) {
        const reminderTime = user.preferences.reminderTime || '20:00';
        const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number);
        
        // Check if it's time to send reminder (within 5 minutes)
        if (currentHour === reminderHour && Math.abs(currentMinute - reminderMinute) <= 5) {
          // Check if user has already written today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const hasWrittenToday = user.lastWriteDate && 
            user.lastWriteDate >= today;
          
          if (!hasWrittenToday) {
            const payload = JSON.stringify({
              title: 'Time to Write! ✍️',
              body: `Keep your ${user.streak}-day streak alive! Share your thoughts with the community.`,
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              data: {
                url: '/write'
              }
            });
            
            try {
              await webpush.sendNotification(user.pushSubscription, payload);
              console.log(`Reminder sent to user ${user.username}`);
            } catch (error) {
              console.error(`Failed to send reminder to user ${user.username}:`, error);
              
              // If subscription is invalid, remove it
              if (error.statusCode === 410) {
                await User.findByIdAndUpdate(user._id, {
                  pushSubscription: null
                });
              }
            }
          }
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