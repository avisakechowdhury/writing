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
    renotify: false,
    data: payload.data || { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const absoluteUrl = targetUrl.startsWith('http')
    ? targetUrl
    : new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
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
