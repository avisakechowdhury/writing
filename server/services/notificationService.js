import Notification from '../models/Notification.js';

export const createInAppNotification = async ({
  userId,
  actorId = null,
  type,
  title,
  body,
  url = '/'
}) => {
  try {
    if (!userId) return null;
    return await Notification.create({
      userId,
      actorId,
      type,
      title,
      body,
      url
    });
  } catch (error) {
    console.error('createInAppNotification error:', error);
    return null;
  }
};

