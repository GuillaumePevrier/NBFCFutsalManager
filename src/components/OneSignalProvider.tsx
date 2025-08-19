
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

    const oneSignalAppId = "25dbb261-fe4d-4e22-aed3-4051d3f22629";
    
    // Only initialize in browser environments
    if (typeof window === 'undefined') {
        return;
    }

    oneSignalInitialized.current = true;

    // The OneSignal script loader
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.init({
        appId: oneSignalAppId,
        allowLocalhostAsSecureOrigin: true, // Important for development
      });
    });

    // Dynamically create and append the OneSignal SDK script to the document head
    const script = document.createElement('script');
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.async = true;
    document.head.appendChild(script);

    // Cleanup function to remove the script when the component unmounts
    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
      delete window.OneSignal;
      delete window.OneSignalDeferred;
    };
  }, []);

  return null; // This component does not render anything
}
