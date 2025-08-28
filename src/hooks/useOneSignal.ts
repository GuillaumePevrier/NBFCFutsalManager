
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveOneSignalId } from '@/app/actions';
import { useToast } from './use-toast';
import { createClient } from '@/lib/supabase/client';

declare const window: any;

export function useOneSignal() {
  const supabase = createClient();
  const { toast } = useToast();
  const onesignalInitialized = useRef(false);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const updateSubscriptionStatus = useCallback(async () => {
    if (!window.OneSignal) return;
    try {
      const subscribed = await window.OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error("Failed to get subscription status:", error);
    }
  }, []);

  // Effect to handle auth changes and login/logout to OneSignal
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setCurrentUserId(session!.user.id);
        if (window.OneSignal) {
           console.log('User signed in, logging into OneSignal.');
           window.OneSignal.login(session!.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUserId(null);
        if (window.OneSignal) {
           console.log('User signed out, logging out from OneSignal.');
           window.OneSignal.logout();
        }
      }
    });
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if(session) {
            setCurrentUserId(session.user.id);
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  // Effect to initialize OneSignal and set up listeners
  useEffect(() => {
    if (onesignalInitialized.current || !window.OneSignal) return;
    onesignalInitialized.current = true;

    console.log("Initializing OneSignal and adding listeners...");

    const onSubscriptionChange = async (isSubscribed: boolean) => {
        console.log("OneSignal subscription changed to:", isSubscribed);
        setIsSubscribed(isSubscribed);

        if (isSubscribed) {
            const onesignalId = await window.OneSignal.getUserId();
            console.log('User is subscribed. OneSignal ID:', onesignalId);
            await saveOneSignalId(onesignalId);
        } else {
            console.log('User is not subscribed.');
            await saveOneSignalId(null);
        }
    };
    
    // Initialize and add listener
    window.OneSignal.on('subscriptionChange', onSubscriptionChange);

    // Clean up listener on component unmount
    return () => {
        if (window.OneSignal) {
            console.log("Removing OneSignal listeners.");
            window.OneSignal.off('subscriptionChange', onSubscriptionChange);
        }
    };
  }, []);
  
   // Check initial subscription status once OneSignal is available
  useEffect(() => {
    if (window.OneSignal) {
        updateSubscriptionStatus();
    }
  }, []);


  const handleSubscription = async () => {
    if (!window.OneSignal) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    try {
      const isCurrentlySubscribed = await window.OneSignal.isPushNotificationsEnabled();
      if (isCurrentlySubscribed) {
        await window.OneSignal.removeSubscription(); // Correct method to opt-out
        toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
      } else {
        await window.OneSignal.Notifications.requestPermission();
        // The 'subscriptionChange' event listener will handle the rest (saving the ID)
      }
    } catch (e) {
      console.error("Error with OneSignal subscription:", e);
      toast({ title: "Erreur", description: "Impossible de modifier votre abonnement aux notifications.", variant: "destructive" });
    }
  };

  return { isSubscribed, handleSubscription };
}
