'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import OneSignal from 'react-onesignal';
import { saveOneSignalId } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useOneSignal() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOneSignalInitialized, setIsOneSignalInitialized] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const pathname = usePathname();

  const getSubscriptionStatus = useCallback(async () => {
    const state = await OneSignal.getNotificationPermission();
    const id = await OneSignal.getSubscriptionId();
    setIsSubscribed(state === 'granted' && !!id);
  }, []);

  const onSubscriptionChange = useCallback(async (subscribed: boolean) => {
    console.log("OneSignal Subscription changed:", subscribed);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const onesignalId = subscribed ? await OneSignal.getSubscriptionId() : null;
      await saveOneSignalId(user.id, onesignalId);
    }
    
    setIsSubscribed(subscribed);
  }, [supabase.auth]);

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
        notifyButton: {
            enable: true,
        }
      });
      
      console.log('OneSignal initialized.');

      // Check initial subscription status
      getSubscriptionStatus();
      
      // Add event listener for subscription changes
      OneSignal.on('subscriptionChange', onSubscriptionChange);
    };

    // Only run on client-side
    if (typeof window !== 'undefined') {
      initOneSignal();
    }
    
    return () => {
       if (typeof window !== 'undefined') {
         OneSignal.off('subscriptionChange', onSubscriptionChange);
       }
    }
  }, [isOneSignalInitialized, getSubscriptionStatus, onSubscriptionChange]);

  // Handle user login/logout
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
        if (!isOneSignalInitialized) return;

        if (event === 'SIGNED_IN' && session?.user) {
            await OneSignal.login(session.user.id);
            console.log('OneSignal login called for user:', session.user.id);
        } else if (event === 'SIGNED_OUT') {
            await OneSignal.logout();
            console.log('OneSignal logout called.');
        }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleAuthChange(event, session);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [isOneSignalInitialized, supabase.auth]);


  // OneSignal's notify button might not be ideal for all layouts.
  // This provides a manual way to trigger the prompt.
  const handleSubscription = async () => {
    if (!isOneSignalInitialized) {
        toast({ title: "OneSignal non prêt", description: "Veuillez patienter quelques instants.", variant: "destructive"});
        return;
    }

    if (isSubscribed) {
      // User wants to unsubscribe
      await OneSignal.setSubscription(false);
      toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications."});
    } else {
      // User wants to subscribe
      await OneSignal.setSubscription(true);
      toast({ title: "Notifications activées !", description: "Vous recevrez désormais les notifications."});
    }
  };

  return { isSubscribed, handleSubscription };
}
