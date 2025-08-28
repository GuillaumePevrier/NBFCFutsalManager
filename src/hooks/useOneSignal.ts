
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveOneSignalId } from '@/app/actions';
import { useToast } from './use-toast';
import { createClient } from '@/lib/supabase/client';

declare const window: any;

export function useOneSignal() {
  const supabase = createClient();
  const { toast } = useToast();
  const initialized = useRef(false);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // This callback handles the logic after a subscription state changes in OneSignal
  const onSubscriptionChange = useCallback(async () => {
    try {
        const subscribed = window.OneSignal.Notifications.permission;
        setIsSubscribed(subscribed);
        
        if (subscribed) {
            const { onesignalId } = await window.OneSignal.User.getIds();
            console.log('User is subscribed. OneSignal ID:', onesignalId);
            await saveOneSignalId(onesignalId);
        } else {
            console.log('User is not subscribed.');
            await saveOneSignalId(null);
        }
    } catch (error) {
        console.error("Error handling subscription change:", error);
    }
  }, []);

  // Main effect for initialization and user session handling
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function(OneSignal: any) {
        if (window.__OS_INIT__) return;
        window.__OS_INIT__ = true;
        
        OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
            serviceWorker: {
                path: "/OneSignalSDKWorker.js",
            }
        });

        // This event fires when the user's subscription state changes
        OneSignal.Notifications.addEventListener('change', onSubscriptionChange);
    });

    const handleAuthChange = async (event: string, session: any) => {
        if (event === 'SIGNED_IN' && window.OneSignal) {
            console.log('User signed in, logging into OneSignal.');
            window.OneSignal.login(session.user.id);
            // Check initial subscription status on login
            setIsSubscribed(window.OneSignal.Notifications.permission);
        } else if (event === 'SIGNED_OUT' && window.OneSignal) {
            console.log('User signed out, logging out from OneSignal.');
            window.OneSignal.logout();
            setIsSubscribed(false);
        }
    };
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if(session) handleAuthChange('SIGNED_IN', session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      authListener?.subscription.unsubscribe();
       if (window.OneSignal) {
           window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
       }
    };
  }, [supabase.auth, onSubscriptionChange]);


  // This function is called by the UI (the bell icon)
  const handleSubscription = async () => {
    if (!window.OneSignal) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    try {
      const isCurrentlySubscribed = window.OneSignal.Notifications.permission;
      if (isCurrentlySubscribed) {
        await window.OneSignal.User.pushSubscription.optOut();
        toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
      } else {
        await window.OneSignal.Notifications.requestPermission();
        // The 'change' event listener will handle the rest
      }
    } catch (e) {
      console.error("Error with OneSignal subscription:", e);
      toast({ title: "Erreur", description: "Impossible de modifier votre abonnement aux notifications.", variant: "destructive" });
    }
  };

  return { isSubscribed, handleSubscription };
}
