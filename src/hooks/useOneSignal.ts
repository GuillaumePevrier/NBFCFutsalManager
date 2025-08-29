
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

  const updateSubscriptionStatus = useCallback(async () => {
    if (!window.OneSignal || !window.OneSignal.isInitialized) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    try {
      const permission = window.OneSignal.Notifications.permission;
      setIsSubscribed(permission === 'granted');
    } catch (error) {
      console.error("Failed to get subscription status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;
      setCurrentUserId(userId || null);
      if (window.OneSignal && window.OneSignal.isInitialized) {
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
      if (session) {
        const userId = session.user.id;
        setCurrentUserId(userId);
         if (window.OneSignal && window.OneSignal.isInitialized) {
           window.OneSignal.login(userId);
         }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (onesignalInitialized.current) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function(OneSignal) {
      if (onesignalInitialized.current || !OneSignal.isInitialized) return;
      onesignalInitialized.current = true;
      
      console.log("Initializing OneSignal and adding listeners...");

      const onSubscriptionChange = async () => {
        console.log("OneSignal subscription changed.");
        await updateSubscriptionStatus();
        const onesignalId = OneSignal.User.PushSubscription.id;
        if (currentUserId) {
            await saveOneSignalId(onesignalId || null);
        }
      };
      
      OneSignal.Notifications.addEventListener('change', onSubscriptionChange);
      updateSubscriptionStatus();
    });
  }, [updateSubscriptionStatus, currentUserId]);


  const handleSubscription = async () => {
    if (!window.OneSignal || !window.OneSignal.isInitialized) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    
    try {
        const permission = window.OneSignal.Notifications.permission;
        if (permission === 'granted') {
            await window.OneSignal.User.PushSubscription.optOut();
            toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
        } else {
            await window.OneSignal.Notifications.requestPermission();
        }
    } catch (error) {
        console.error("Error with OneSignal subscription:", error);
        toast({ title: "Erreur", description: "Impossible de modifier votre abonnement.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
        updateSubscriptionStatus();
    }
  };

  return { isSubscribed, isLoading, isProcessing, handleSubscription };
}
