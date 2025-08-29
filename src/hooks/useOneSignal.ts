
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
      const permission = await window.OneSignal.Notifications.getPermission();
      setIsSubscribed(permission === 'granted');
    } catch (error) {
      console.error("Failed to get subscription status:", error);
    }
  }, []);

  // Effect to handle auth changes and login/logout to OneSignal
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userId = session?.user?.id;
      setCurrentUserId(userId || null);
      if (window.OneSignal) {
        if (event === 'SIGNED_IN' && userId) {
          console.log('User signed in, logging into OneSignal.');
          await window.OneSignal.login(userId);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, logging out from OneSignal.');
          await window.OneSignal.logout();
        }
      }
    });
    
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if(session) {
            const userId = session.user.id;
            setCurrentUserId(userId);
            if (window.OneSignal?.isInitialized) {
                await window.OneSignal.login(userId);
            }
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);

  // Effect to initialize OneSignal and set up listeners
  useEffect(() => {
    if (onesignalInitialized.current) return;
    
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function(OneSignal) {
        if (onesignalInitialized.current) return;
        
        console.log("Initializing OneSignal and adding listeners...");
        onesignalInitialized.current = true;

        const onSubscriptionChange = async () => {
            console.log("OneSignal subscription changed.");
            await updateSubscriptionStatus();
            
            const onesignalId = OneSignal.User.PushSubscription.id;
            console.log('Push Subscription ID:', onesignalId);

            if (onesignalId) {
                await saveOneSignalId(onesignalId);
            } else {
                await saveOneSignalId(null);
            }
        };

        OneSignal.Notifications.addEventListener('change', onSubscriptionChange);

        // Initial check
        updateSubscriptionStatus();
    });

  }, [updateSubscriptionStatus]);


  const handleSubscription = async () => {
    if (!window.OneSignal) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    try {
        const permission = await window.OneSignal.Notifications.getPermission();
        if (permission === 'granted') {
            await window.OneSignal.User.PushSubscription.optOut();
            await saveOneSignalId(null);
            setIsSubscribed(false);
            toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
        } else {
            await window.OneSignal.Notifications.requestPermission();
        }
    } catch (e) {
      console.error("Error with OneSignal subscription:", e);
      toast({ title: "Erreur", description: "Impossible de modifier votre abonnement aux notifications.", variant: "destructive" });
    }
  };

  return { isSubscribed, handleSubscription };
}
