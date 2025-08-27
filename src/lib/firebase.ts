
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, onMessage, isSupported } from 'firebase/messaging';

// This function now returns the config object or null
function getFirebaseConfig() {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    // Check if all required config values are present on the client
    if (
        !firebaseConfig.apiKey ||
        !firebaseConfig.projectId ||
        !firebaseConfig.messagingSenderId ||
        !firebaseConfig.appId
    ) {
        console.error("Firebase config values are missing. Check your environment variables.");
        return null;
    }
    return firebaseConfig;
}


// This function centralizes Firebase app initialization.
export const initializeFirebaseApp = (): FirebaseApp | null => {
    const config = getFirebaseConfig();
    if (!config) return null;
    return getApps().length > 0 ? getApp() : initializeApp(config);
};

// This function sets up the foreground message listener.
// It should only be called when a subscription is active.
export const onMessageListener = async (callback: (payload: any) => void) => {
    const supported = await isSupported();
    if (supported) {
        const app = initializeFirebaseApp();
        if (app) {
            const messaging = getMessaging(app);
            return onMessage(messaging, (payload) => {
                callback(payload);
            });
        }
    }
    return null; // Return null if not supported or app fails to init
};
