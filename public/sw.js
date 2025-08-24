
// This is a custom service worker.
// `self` is the service worker instance.

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'NBFC Futsal';
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'nbfc-notification',
    data: {
      url: data.data?.url || self.registration.scope,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window for the app is already open, focus it.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// This is required for the service worker to be installable.
self.addEventListener('fetch', (event) => {
  // We are not doing any caching here, just fulfilling the requirement.
  // Next-PWA will inject its own precaching logic.
});

// This is the part that was missing a proper way to get the env var.
// process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY will be replaced by its actual value at build time by Workbox.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
