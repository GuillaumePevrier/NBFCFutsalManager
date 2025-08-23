
// Listen for push events
self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = data.title || 'Nouvelle Notification';
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png', // Default icon
    badge: '/icon-96x96.png', // Badge for notifications (must be monochrome)
    vibrate: [200, 100, 200],
    tag: data.tag || 'default-tag',
    data: {
      url: data.data?.url || '/', // URL to open on click
    },
  };

  // Set a badge on the app icon if the API is available
  if (self.navigator.setAppBadge) {
    self.navigator.setAppBadge();
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for notification click events
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); // Close the notification

  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  
  // Clear the badge when the notification is clicked
  if (self.navigator.clearAppBadge) {
      self.navigator.clearAppBadge();
  }


  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // If a window for the app is already open, focus it
      if (clientList.length > 0) {
        for (const client of clientList) {
            // Check if a client for the exact URL is already open
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // If no exact match is found, focus the first available client and navigate it
         if (clientList[0].url && 'focus' in clientList[0] && 'navigate' in clientList[0]) {
             clientList[0].focus();
             return clientList[0].navigate(urlToOpen);
         }
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
