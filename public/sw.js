const resolveAssetUrl = (path) => {
  if (!path) return new URL('/logo.png', self.location.origin).href;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, self.location.origin).href;
};

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'WriteAnon', body: event.data.text() };
  }

  const title = payload.title || 'WriteAnon';
  const tag = payload.tag || payload?.data?.tag;
  const options = {
    body: payload.body || '',
    icon: resolveAssetUrl(payload.icon),
    badge: resolveAssetUrl(payload.badge),
    tag: tag || undefined,
    // renotify: true ensures the user sees the notification even if the
    // same tag is reused (prevents silent replacement that Chrome may flag)
    renotify: Boolean(tag),
    // Include timestamp so Chrome can order notifications properly
    timestamp: payload.timestamp || Date.now(),
    // requireInteraction keeps the notification visible for important messages
    requireInteraction: payload.requireInteraction || false,
    // Actions give users quick interaction options — Chrome ranks these higher
    actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : [],
    // Don't play sound for non-critical notifications to avoid spam perception
    silent: payload.data?.type === 'reminder',
    data: payload.data || { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  // If user clicked "dismiss" action, just close — don't navigate
  if (action === 'dismiss') return;

  const targetUrl = data.url || '/';
  const absoluteUrl = targetUrl.startsWith('http')
    ? targetUrl
    : new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window first
      for (const client of windowClients) {
        if (client.url === absoluteUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no matching window, navigate an existing one or open new
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
      return null;
    })
  );
});

// Track notification close events for analytics / future spam tuning
self.addEventListener('notificationclose', (event) => {
  // Intentionally empty — can be used for analytics later
});
