
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveOneSignalId } from '@/app/actions';
import { useToast } from './use-toast';
import { createClient } from '@/lib/supabase/client';

declare const window: any;

export function useOneSignal() {
  const supabase = createClient();
  const { toast } = useToast();
  
  // Ref to ensure OneSignal initialization logic only runs once.
  const onesignalInitialized = useRef(false);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // This function checks the current subscription status and updates the state.
  const onSubscriptionChange = useCallback(async () => {
    if (!window.OneSignal) return;
    
    setIsLoading(true);
    const permission = window.OneSignal.Notifications.permission;
    const subscribed = permission === 'granted';
    setIsSubscribed(subscribed);

    // If the user is logged in, sync their OneSignal ID with the database.
    if (currentUserId) {
        const onesignalId = subscribed ? window.OneSignal.User.PushSubscription.id : null;
        if(onesignalId !== undefined) {
             await saveOneSignalId(onesignalId);
        }
    }
    setIsLoading(false);
  }, [currentUserId]);

  // This function runs once to set up OneSignal and its event listeners.
  const initializeOneSignal = useCallback(() => {
    if (onesignalInitialized.current || !window.OneSignalDeferred) return;
    
    onesignalInitialized.current = true;
    console.log("Initializing OneSignal and adding listeners...");
    
    window.OneSignalDeferred.push(function(OneSignal: any) {
        if (!OneSignal.isInitialized) {
          // The script in layout.tsx should handle this, but as a fallback:
          OneSignal.init({ appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID });
        }
        OneSignal.isInitialized = true;
        
        // Add a listener for any future changes to subscription status
        OneSignal.Notifications.addEventListener('change', onSubscriptionChange);
    });
  }, [onSubscriptionChange]);
  
  // Effect for handling authentication changes (login/logout)
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
         if (window.OneSignal?.isInitialized && userId) {
           console.log(`User already logged in (${userId}), logging into OneSignal.`);
           window.OneSignal.login(userId);
         }
    });
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
        
        if (window.OneSignal?.isInitialized) {
            if (event === 'SIGNED_IN' && userId) {
                console.log('User signed in, logging into OneSignal.');
                window.OneSignal.login(userId);
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out, logging out from OneSignal.');
                window.OneSignal.logout();
            }
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  // Effect for initializing OneSignal SDK and checking initial state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize OneSignal
    initializeOneSignal();
    
    // Check initial subscription status once OneSignal is ready
    window.OneSignalDeferred.push(function() {
      onSubscriptionChange();
    });

    // Cleanup listeners on component unmount
    return () => {
        if (window.OneSignal && onesignalInitialized.current) {
            window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
        }
    };
  }, [initializeOneSignal, onSubscriptionChange]);


  // This function is called when the user clicks the notification bell.
  const handleSubscription = async () => {
    if (!window.OneSignal || !window.OneSignal.isInitialized) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const permission = window.OneSignal.Notifications.permission;

    try {
      if (permission === 'granted') {
        // If already subscribed, opt out
        await window.OneSignal.User.PushSubscription.optOut();
        toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
      } else if (permission === 'denied') {
        toast({ title: "Notifications bloquées", description: "Veuillez autoriser les notifications dans les paramètres de votre navigateur.", variant: "destructive" });
      } else {
        // If not subscribed, request permission
        await window.OneSignal.Notifications.requestPermission();
        // The 'change' event listener will handle the success case and update the DB.
      }
    } catch (error) {
      console.error("Error with OneSignal subscription:", error);
      toast({ title: "Erreur", description: "Impossible de modifier votre abonnement.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return { isSubscribed, isLoading, isProcessing, handleSubscription };
}
