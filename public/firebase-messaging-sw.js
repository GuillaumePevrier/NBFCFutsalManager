
// Import and initialize Firebase SDK
// It is safe to import and initialize Firebase here because this code is executed in a service worker
// context, where there is no DOM.
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyAiAcWx8HkKBsSWbd8Hu6w0Ksyts6ZspDo",
    authDomain: "futsaltactics-board.firebaseapp.com",
    projectId: "futsaltactics-board",
    storageBucket: "futsaltactics-board.appspot.com",
    messagingSenderId: "711611587508",
    appId: "1:711611587508:web:c94371117105d11e01b0e1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192x192.png', // Default icon
    tag: payload.notification.tag,
    data: payload.data, // Pass along data for click handling
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});

// Added event listener for notification click
self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url == urlToOpen && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow)
        return clients.openWindow(urlToOpen);
    })
  );
});
