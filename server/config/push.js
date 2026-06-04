const DEFAULT_CLIENT_URL = 'https://writeanon.in';

export const getClientBaseUrl = () => {
  const raw = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
  const first = raw.split(',')[0]?.trim();
  return first || DEFAULT_CLIENT_URL;
};

export const getPushIconUrl = () => `${getClientBaseUrl()}/logo.png`;

export const getPushBadgeUrl = () => `${getClientBaseUrl()}/logo.png`;
