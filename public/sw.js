// This file must be in the public folder.

self.addEventListener("push", (event) => {
  const data = event.data.json();
  const title = data.title || "Nouvelle Notification";
  
  const options = {
    body: data.body,
    icon: data.icon || "/icon-192x192.png", // Default icon
    badge: "/badge-72x72.png", // Badge for Android
    vibrate: [200, 100, 200],
    tag: data.tag, // Used to group notifications
    data: {
      url: data.url, // URL to open on click
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    clients.openWindow(urlToOpen).then((windowClient) => {
      // If the window/tab is already open, focus it.
      return windowClient ? windowClient.focus() : null;
    })
  );
});

// Listener to ensure the service worker is activated promptly
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
