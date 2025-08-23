// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Nouvelle Notification';
  const options = {
    body: data.body || 'Vous avez une nouvelle mise à jour.',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-96x96.png', // Icône pour la barre de statut
    tag: data.tag || 'default-tag',
    renotify: true,
    data: {
      url: data.data?.url || '/',
    },
  };

  // Keep the service worker alive until the notification is shown.
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
  
  // Set a badge on the app icon if the Badging API is supported
  if (self.navigator.setAppBadge) {
     self.navigator.setAppBadge();
  }
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const urlToOpen = notification.data.url;

  notification.close(); // Close the notification

  // This looks for an existing window and focuses it.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        client.focus();
        return client.navigate(urlToOpen);
      }
      return clients.openWindow(urlToOpen);
    }).then(() => {
        // Clear the badge when the notification is clicked.
        if (self.navigator.clearAppBadge) {
            self.navigator.clearAppBadge();
        }
    })
  );
});
