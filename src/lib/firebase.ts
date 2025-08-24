
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAiAcWx8HkKBsSWbd8Hu6w0Ksyts6ZspDo",
  authDomain: "futsaltactics-board.firebaseapp.com",
  projectId: "futsaltactics-board",
  storageBucket: "futsaltactics-board.firebasestorage.app",
  messagingSenderId: "711611587508",
  appId: "1:711611587508:web:c94371117105d11e01b0e1"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const messaging = (typeof window !== 'undefined') ? getMessaging(app) : null;

export { app, messaging };

export const requestForToken = async () => {
  if (!messaging) {
    console.log("Firebase Messaging is not available.");
    return null;
  }
  
  try {
    const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () => {
    if (!messaging) {
        return new Promise((resolve) => resolve(null));
    }
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
};
