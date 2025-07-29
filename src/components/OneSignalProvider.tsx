
'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider() {
  useEffect(() => {
    const initOneSignal = async () => {
      if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        console.warn("OneSignal App ID is not set. Notifications will be disabled.");
        return;
      }
      
      await OneSignal.init({ 
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: true,
        },
      });
    };

    initOneSignal();
  }, []);

  return null; // This component does not render anything
}
