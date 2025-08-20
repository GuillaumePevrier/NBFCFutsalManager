
// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || "Nouvelle Notification";
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag,
    data: {
      url: data.data?.url // Passer l'URL de redirection
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Si un client (onglet) de l'application est déjà ouvert, le focus
      if (clientList.length > 0) {
        for (const client of clientList) {
            // Vérifier si le client est sur la bonne page, sinon naviguer
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        // Si aucun client n'est sur la bonne page, en prendre un et le naviguer
        if (clientList[0].navigate && 'focus' in clientList[0]) {
            clientList[0].navigate(urlToOpen);
            return clientList[0].focus();
        }
      }
      // Sinon, ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
