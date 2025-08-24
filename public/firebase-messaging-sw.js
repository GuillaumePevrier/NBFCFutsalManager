
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiAcWx8HkKBsSWbd8Hu6w0Ksyts6ZspDo",
  authDomain: "futsaltactics-board.firebaseapp.com",
  projectId: "futsaltactics-board",
  storageBucket: "futsaltactics-board.firebasestorage.app",
  messagingSenderId: "711611587508",
  appId: "1:711611587508:web:c94371117105d11e01b0e1"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
