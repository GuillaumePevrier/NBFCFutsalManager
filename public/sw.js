// public/sw.js

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }
  
  const data = event.data.json();
  const title = data.title || 'NBFC Futsal';
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png', // Default icon
    badge: '/badge-72x72.png', // Icon for the notification bar (monochrome)
    tag: data.tag, // Group notifications
    data: {
      url: data.data?.url // URL to open on click
    }
  };

  // Show notification
  const notificationPromise = self.registration.showNotification(title, options);
  
  // Set the badge on the app icon
  if (navigator.setAppBadge) {
    // We don't know the exact count, so we just show a dot by incrementing.
    // The badge is cleared when the app is opened.
    navigator.setAppBadge(); 
  }

  event.waitUntil(notificationPromise);
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data?.url || '/';

  // This looks at all open tabs and focuses the one that matches the URL,
  // otherwise it opens a new tab.
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;

    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }

    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
