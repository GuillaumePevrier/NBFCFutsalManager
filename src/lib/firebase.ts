
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Function to safely initialize Firebase
export function initializeFirebaseApp() {
    if (
        !firebaseConfig.apiKey ||
        !firebaseConfig.projectId ||
        !firebaseConfig.appId
    ) {
        // This will now be primarily a warning for developers during build/dev time.
        // The runtime check is implicitly handled by not calling this function
        // until the variables are available.
        console.warn("Firebase config values are missing. Ensure they are set in your environment.");
        return null;
    }
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export const getFirebaseMessaging = () => {
  const app = getApps().length > 0 ? getApp() : null;
  if (app && typeof window !== 'undefined' && 'PushManager' in window) {
    return getMessaging(app);
  }
  return null;
}


export const requestForToken = async () => {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.log("Firebase Messaging is not available in this browser.");
    return null;
  }
  
  try {
    const swRegistration = await navigator.serviceWorker.ready;
    const currentToken = await getToken(messaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration
    });

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    throw err; // Re-throw the error to be caught by the caller
  }
};

export const onMessageListener = () => {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
        return new Promise((resolve) => resolve(null));
    }
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
};
