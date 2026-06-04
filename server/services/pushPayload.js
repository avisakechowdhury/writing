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
  data: {
    url,
    type,
    tag: tag || undefined
  }
});
