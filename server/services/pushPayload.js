import { getPushBadgeUrl, getPushIconUrl } from '../config/push.js';

export const buildPushPayload = ({
  title,
  body,
  url = '/',
  tag = null,
  type = 'general'
}) => ({
  title: title || 'WriteAnon',
  body: body || '',
  icon: getPushIconUrl(),
  badge: getPushBadgeUrl(),
  tag: tag || undefined,
  // Timestamp helps Chrome properly order and deduplicate notifications
  timestamp: Date.now(),
  // requireInteraction keeps the notification visible until the user interacts
  // (only for important types like messages, not reminders)
  requireInteraction: type === 'message',
  // Actions give users quick ways to interact — Chrome ranks actionable
  // notifications higher and is less likely to suppress them
  actions: getActionsForType(type, url),
  data: {
    url,
    type,
    tag: tag || undefined,
    timestamp: Date.now()
  }
});

function getActionsForType(type, url) {
  switch (type) {
    case 'reminder':
      return [
        { action: 'open', title: '✍️ Start Writing' },
        { action: 'dismiss', title: 'Later' }
      ];
    case 'message':
      return [
        { action: 'open', title: '💬 Reply' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'like':
    case 'comment':
      return [
        { action: 'open', title: '👀 View' }
      ];
    default:
      return [
        { action: 'open', title: 'Open' }
      ];
  }
}
