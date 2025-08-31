
'use client';

import { useEffect, useState, useCallback } from 'react';
import { saveOneSignalId } from '@/app/actions';
import { useToast } from './use-toast';
import { createClient } from '@/lib/supabase/client';

declare const window: any;

export function useOneSignal() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const updateSubscriptionStatus = useCallback(async () => {
    if (!window.OneSignal) return;
    
    setIsLoading(true);
    // Use the correct property to check permission
    const permission = window.OneSignal.Notifications.permission;
    const subscribed = permission;
    setIsSubscribed(subscribed);

    if (currentUserId) {
        // Use the correct property for the subscription ID
        const onesignalId = window.OneSignal.User.PushSubscription.id;
        if(onesignalId !== undefined) {
             await saveOneSignalId(subscribed ? onesignalId : null);
        }
    }
    setIsLoading(false);
  }, [currentUserId]);

  const onSubscriptionChange = useCallback(() => {
    updateSubscriptionStatus();
  }, [updateSubscriptionStatus]);


  useEffect(() => {
     const setupOneSignalListeners = () => {
        window.OneSignalDeferred.push(function(OneSignal: any) {
             OneSignal.Notifications.addEventListener('change', onSubscriptionChange);
        });
    };

    if (window.OneSignalDeferred) {
      setupOneSignalListeners();
    } else {
      window.addEventListener('onesignal.init', setupOneSignalListeners);
    }
    
    window.OneSignalDeferred.push(function() {
      updateSubscriptionStatus();
    });

    return () => {
        if (window.OneSignal && window.OneSignal.Notifications) {
            window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
        }
    };
  }, [onSubscriptionChange, updateSubscriptionStatus]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
         if (window.OneSignal?.User?.id && userId) {
           window.OneSignal.login(userId);
         }
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);
        
        if (window.OneSignal?.User) {
            if (event === 'SIGNED_IN' && userId) {
                window.OneSignal.login(userId);
            } else if (event === 'SIGNED_OUT') {
                window.OneSignal.logout();
            }
        }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase.auth]);


  const handleSubscription = async () => {
    if (!window.OneSignal) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const isAllowed = window.OneSignal.Notifications.permission;

    try {
      if (isAllowed) {
        // Correct way to opt out
        await window.OneSignal.User.PushSubscription.optOut();
        toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
      } else {
        // Correct way to request permission
        await window.OneSignal.Notifications.requestPermission();
      }
    } catch (error) {
      console.error("Error with OneSignal subscription:", error);
      toast({ title: "Erreur", description: "Impossible de modifier votre abonnement.", variant: "destructive" });
    } finally {
        // The 'change' event listener will handle the state update automatically
        setIsProcessing(false);
    }
  };

  return { isSubscribed, isLoading, isProcessing, handleSubscription };
}
