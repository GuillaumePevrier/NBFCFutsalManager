
'use client';

import { useEffect, useRef } from 'react';

// Define the OneSignal interface to avoid TypeScript errors
declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any;
  }
}

export default function OneSignalProvider() {
  const oneSignalInitialized = useRef(false);

  useEffect(() => {
    // Prevent the script from running twice in React's strict mode
    if (oneSignalInitialized.current) {
      return;
    }
    oneSignalInitialized.current = true;

    const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!oneSignalAppId) {
        console.error("OneSignal App ID is not configured. Please set NEXT_PUBLIC_ONESIGNAL_APP_ID in your environment variables.");
        return;
    }

    // The OneSignal script loader
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: true,
          displayPredicate: "show", // Force display on all devices
        },
      });
    });

    // Dynamically create and append the OneSignal SDK script to the document head
    const script = document.createElement('script');
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    document.head.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      // Check if the script exists before trying to remove it
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      // A bit more cleanup to be safe
      delete window.OneSignal;
      delete window.OneSignalDeferred;
    };
  }, []);

  return null; // This component does not render anything
}
