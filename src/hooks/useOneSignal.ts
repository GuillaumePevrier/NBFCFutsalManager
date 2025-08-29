
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
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const onSubscriptionChange = useCallback(async () => {
    setIsLoading(true);
    if (!window.OneSignal || !window.OneSignal.Notifications) {
        setIsLoading(false);
        return;
    }
    
    const permission = window.OneSignal.Notifications.permission;
    const subscribed = permission === 'granted';
    setIsSubscribed(subscribed);

    if (currentUserId) {
        const onesignalId = subscribed ? window.OneSignal.User.PushSubscription.id : null;
        if(onesignalId) {
             await saveOneSignalId(onesignalId);
        } else {
            // If not subscribed, we might still need to clear the ID in the database
            await saveOneSignalId(null);
        }
    }
    setIsLoading(false);
  }, [currentUserId]);

  const initializeOneSignal = useCallback(() => {
    if (onesignalInitialized.current) return;
    onesignalInitialized.current = true;
    console.log("Initializing OneSignal and adding listeners...");
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function(OneSignal) {
        if (!OneSignal.isInitialized) return;
        
        // Initial check of subscription status
        onSubscriptionChange();

        // Add a listener for any future changes
        OneSignal.Notifications.addEventListener('change', onSubscriptionChange);
    });
  }, [onSubscriptionChange]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
        
        if (window.OneSignal && onesignalInitialized.current) {
            if (event === 'SIGNED_IN' && userId) {
                console.log('User signed in, logging into OneSignal.');
                window.OneSignal.login(userId);
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out, logging out from OneSignal.');
                window.OneSignal.logout();
            }
        }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
         if (window.OneSignal && onesignalInitialized.current && userId) {
           window.OneSignal.login(userId);
         }
    });

    initializeOneSignal();

    return () => {
        authListener.subscription.unsubscribe();
        if (window.OneSignal && onesignalInitialized.current) {
            window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
        }
    };
  }, [supabase, initializeOneSignal, onSubscriptionChange]);


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
      } else {
        // If not subscribed, request permission
        await window.OneSignal.Notifications.requestPermission();
        // The 'change' event listener will handle the success case
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
