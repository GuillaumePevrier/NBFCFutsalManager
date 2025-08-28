
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveOneSignalId } from '@/app/actions';
import { useToast } from './use-toast';

declare const window: any;

export function useOneSignal() {
  const supabase = createClient();
  const { toast } = useToast();
  const initialized = useRef(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const onSubscriptionChange = useCallback(async (isSubscribed: boolean) => {
    setIsSubscribed(isSubscribed);
    const {data} = await window.OneSignal.User.getIds();
    const onesignalId = data?.onesignalId;
    
    console.log(`OneSignal subscription changed: ${isSubscribed}, ID: ${onesignalId}`);
    
    await saveOneSignalId(isSubscribed ? onesignalId : null);
  }, []);


  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      const user = session?.user;

      if ((event === 'SIGNED_IN' || (event === 'INITIAL_STATE' && user)) && !initialized.current) {
        initialized.current = true;
        
        console.log("Initializing OneSignal for user:", user.id);
        
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal: any) {
          if (window.__OS_INIT_DONE__) return;
          window.__OS_INIT_DONE__ = true;

          await OneSignal.init({
              appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
              allowLocalhostAsSecureOrigin: true,
          });

          // Set external user id
          await OneSignal.login(user.id);
          
          // Add listener for subscription changes
          OneSignal.Notifications.addEventListener('change', onSubscriptionChange);

          // Initial check
          const currentPermission = OneSignal.Notifications.permission;
          setIsSubscribed(currentPermission);
        });

      } else if (event === 'SIGNED_OUT') {
        if (window.OneSignal) {
          console.log("Logging out from OneSignal.");
          window.OneSignal.logout();
        }
        initialized.current = false;
        setIsSubscribed(false);
        if(window.OneSignal?.Notifications) {
          window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
        }
      }
    };

    const init = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await handleAuthChange('INITIAL_STATE', session);
    }
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
        authListener?.subscription?.unsubscribe();
        if(window.OneSignal?.Notifications) {
          window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
        }
    };
  }, [supabase, onSubscriptionChange]);

  const handleSubscription = async () => {
    if (!window.OneSignal) {
      toast({ title: "Erreur", description: "OneSignal n'est pas prêt.", variant: "destructive" });
      return;
    }

    try {
        if (isSubscribed) {
            await window.OneSignal.User.pushSubscription.optOut();
            toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
        } else {
            await window.OneSignal.Notifications.requestPermission();
            // The 'change' event listener will handle the success case
        }
    } catch(e) {
        console.error("Error with OneSignal subscription:", e);
        toast({ title: "Erreur", description: "Impossible de modifier votre abonnement aux notifications.", variant: "destructive" });
    }
  };

  return { isSubscribed, handleSubscription };
}
