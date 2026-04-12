import Notification from '../models/Notification.js';

const MAX_NOTIFICATIONS_PER_USER = 10;
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

function extractPostIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/\/post\/([a-f0-9]{24})/i);
  return m ? m[1] : null;
}

async function pruneOldNotifications(userId) {
  const keep = MAX_NOTIFICATIONS_PER_USER;
  const docs = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean();

  if (docs.length <= keep) return;

  const toRemove = docs.slice(keep).map((d) => d._id);
  await Notification.deleteMany({ _id: { $in: toRemove } });
}

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

    const postId = extractPostIdFromUrl(url);
    const actorObjId = actorId || null;

    if (postId && actorObjId && (type === 'like' || type === 'comment')) {
      const cutoff = new Date(Date.now() - DEDUPE_WINDOW_MS);
      const existing = await Notification.findOne({
        userId,
        type,
        actorId: actorObjId,
        url: { $regex: new RegExp(`/post/${postId}`) },
        createdAt: { $gt: cutoff }
      })
        .sort({ createdAt: -1 })
        .lean();

      if (existing) {
        return existing;
      }
    }

    const created = await Notification.create({
      userId,
      actorId: actorObjId,
      type,
      title,
      body,
      url
    });

    await pruneOldNotifications(userId);

    return created;
  } catch (error) {
    console.error('createInAppNotification error:', error);
    return null;
  }
};
