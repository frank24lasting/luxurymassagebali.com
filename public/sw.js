self.addEventListener('push', (event) => {
  let payload = {
    title: 'Booking baru masuk',
    body: 'Appointment baru masuk ke Luxury Massage Bali.',
    url: '/langitdewata/appointments',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.tag || 'luxury-massage-bali-admin-order',
    renotify: true,
    requireInteraction: true,
    data: { url: payload.url || '/langitdewata/appointments' },
    actions: [{ action: 'open', title: 'Buka Appointment' }],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/langitdewata/appointments';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes('/langitdewata')) {
          client.focus();
          if ('navigate' in client) return client.navigate(targetUrl);
          return undefined;
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
