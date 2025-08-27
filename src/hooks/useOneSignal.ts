
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { saveOneSignalId } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useOneSignal() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOneSignalInitialized, setIsOneSignalInitialized] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const onSubscriptionChangeRef = useRef<((subscribed: boolean) => void) | null>(null);


  const getSubscriptionStatus = useCallback(async () => {
    const isUserSubscribed = await OneSignal.isPushNotificationsEnabled();
    setIsSubscribed(isUserSubscribed);
  }, []);

  const onSubscriptionChange = useCallback(async (subscribed: boolean) => {
    console.log("OneSignal Subscription changed:", subscribed);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const onesignalId = subscribed ? await OneSignal.getUserId() : null;
      await saveOneSignalId(user.id, onesignalId);
    }
    
    setIsSubscribed(subscribed);
  }, [supabase]);
  
  // Store the function in a ref to keep it stable for useEffect dependencies
  useEffect(() => {
    onSubscriptionChangeRef.current = onSubscriptionChange;
  }, [onSubscriptionChange]);

  useEffect(() => {
    const initOneSignal = async () => {
      if (isOneSignalInitialized || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
        return;
      }
      
      console.log('Initializing OneSignal...');
      setIsOneSignalInitialized(true);

      await OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
      });
      
      console.log('OneSignal initialized.');

      // Check initial subscription status
      getSubscriptionStatus();
      
      // Add event listener for subscription changes
      OneSignal.on('subscriptionChange', (subscribed) => {
          if(onSubscriptionChangeRef.current) {
              onSubscriptionChangeRef.current(subscribed);
          }
      });
    };

    // Only run on client-side
    if (typeof window !== 'undefined') {
      initOneSignal();
    }
    
  }, [isOneSignalInitialized, getSubscriptionStatus]);

  // Handle user login/logout to link OneSignal subscription to Supabase user
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
        if (!isOneSignalInitialized) return;

        if (event === 'SIGNED_IN' && session?.user) {
            // OneSignal recommends using an external ID to link users
            await OneSignal.setExternalUserId(session.user.id);
            console.log('OneSignal external user ID set:', session.user.id);
        } else if (event === 'SIGNED_OUT') {
            await OneSignal.removeExternalUserId();
            console.log('OneSignal external user ID removed.');
        }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleAuthChange(event, session);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [isOneSignalInitialized, supabase.auth]);


  // This provides a manual way to trigger the prompt.
  const handleSubscription = async () => {
    if (!isOneSignalInitialized) {
        toast({ title: "OneSignal non prêt", description: "Veuillez patienter quelques instants.", variant: "destructive"});
        return;
    }

    if (isSubscribed) {
      await OneSignal.setSubscription(false);
      toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications."});
    } else {
      await OneSignal.setSubscription(true);
      // The 'subscriptionChange' event will handle the rest
      toast({ title: "Notifications activées !", description: "Merci ! Vous recevrez désormais les notifications."});
    }
  };

  return { isSubscribed, handleSubscription };
}
