
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, onMessage, isSupported } from 'firebase/messaging';

// This function centralizes Firebase app initialization and service worker registration.
export const initializeFirebaseApp = async (): Promise<FirebaseApp | null> => {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // Check if all required config values are present
    if (
        !firebaseConfig.apiKey ||
        !firebaseConfig.projectId ||
        !firebaseConfig.messagingSenderId ||
        !firebaseConfig.appId
    ) {
        console.error("Firebase config values are missing. Check your environment variables.");
        return null;
    }
    
    // Initialize Firebase app if it doesn't exist
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // Register Service Worker for FCM
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('FCM Service Worker registered successfully:', registration);
        } catch (error) {
            console.error('FCM Service Worker registration failed:', error);
            // We don't return null here, as the app can still run without push notifications
        }
    }

    return app;
};

// This function sets up the foreground message listener.
// It should only be called when a subscription is active.
export const onMessageListener = (callback: (payload: any) => void) => {
    return isSupported().then(supported => {
        if (supported) {
            const app = getApp(); // Assume app is already initialized
            const messaging = getMessaging(app);
            return onMessage(messaging, (payload) => {
                callback(payload);
            });
        }
        return () => {}; // Return an empty unsubscribe function if not supported
    });
};
