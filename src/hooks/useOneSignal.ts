
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
    if (!window.OneSignal) return;
    
    setIsLoading(true);
    const permission = window.OneSignal.Notifications.permission;
    const subscribed = permission === 'granted';
    setIsSubscribed(subscribed);

    if (currentUserId) {
        const onesignalId = subscribed ? window.OneSignal.User.PushSubscription.id : null;
        if(onesignalId !== undefined) {
             await saveOneSignalId(onesignalId);
        }
    }
    setIsLoading(false);
  }, [currentUserId]);

  const initializeOneSignal = useCallback(() => {
    if (onesignalInitialized.current || !window.OneSignalDeferred) return;
    
    onesignalInitialized.current = true;
    
    window.OneSignalDeferred.push(function(OneSignal: any) {
        OneSignal.Notifications.addEventListener('change', onSubscriptionChange);
    });
  }, [onSubscriptionChange]);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
         if (window.OneSignal?.isInitialized() && userId) {
           window.OneSignal.login(userId);
         }
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
        
        if (window.OneSignal?.isInitialized()) {
            if (event === 'SIGNED_IN' && userId) {
                window.OneSignal.login(userId);
            } else if (event === 'SIGNED_OUT') {
                window.OneSignal.logout();
            }
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    initializeOneSignal();
    
    window.OneSignalDeferred.push(function() {
      onSubscriptionChange();
    });

    return () => {
        if (window.OneSignal && onesignalInitialized.current) {
            window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
        }
    };
  }, [initializeOneSignal, onSubscriptionChange]);


  const handleSubscription = async () => {
    if (!window.OneSignal?.isInitialized()) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const permission = window.OneSignal.Notifications.permission;

    try {
      if (permission === 'granted') {
        await window.OneSignal.User.PushSubscription.optOut();
        toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
      } else if (permission === 'denied') {
        toast({ title: "Notifications bloquées", description: "Veuillez autoriser les notifications dans les paramètres de votre navigateur.", variant: "destructive" });
      } else {
        await window.OneSignal.Notifications.requestPermission();
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
