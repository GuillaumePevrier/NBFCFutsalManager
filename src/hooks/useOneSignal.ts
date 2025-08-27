
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import OneSignal from 'react-onesignal';
import { saveOneSignalId } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

export function useOneSignal() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  
  // Utiliser une référence pour s'assurer que l'initialisation ne se produit qu'une seule fois.
  const isInitialized = useRef(false);

  const onSubscriptionChange = useCallback(async (subscribed: boolean) => {
    console.log("OneSignal Subscription changed:", subscribed);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const onesignalId = subscribed ? await OneSignal.getUserId() : null;
      await saveOneSignalId(user.id, onesignalId);
    }
    
    setIsSubscribed(subscribed);
  }, [supabase]);


  useEffect(() => {
    // Ne jamais ré-initialiser si c'est déjà fait.
    if (isInitialized.current || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      return;
    }

    const initOneSignal = async () => {
      console.log('Initializing OneSignal...');
      isInitialized.current = true; // Marquer comme initialisé immédiatement

      await OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        // Ne pas afficher la cloche native, nous gérons notre propre bouton
        notifyButton: { 
            enable: false,
        }
      });
      
      console.log('OneSignal initialized.');

      const isUserSubscribed = await OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(isUserSubscribed);
      
      OneSignal.on('subscriptionChange', (subscribed) => {
        onSubscriptionChange(subscribed);
      });
    };

    if (typeof window !== 'undefined') {
      initOneSignal();
    }
  }, [onSubscriptionChange]);

  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
        if (!isInitialized.current) return;

        if (event === 'SIGNED_IN' && session?.user) {
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
  }, [supabase.auth]);

  const handleSubscription = async () => {
    if (!isInitialized.current) {
        toast({ title: "OneSignal non prêt", description: "Veuillez patienter quelques instants.", variant: "destructive"});
        return;
    }

    try {
        if (isSubscribed) {
          // OneSignal n'a pas de méthode simple pour se désabonner via code,
          // l'utilisateur doit le faire via les paramètres du navigateur ou la cloche native.
          // Ici on met à jour notre BDD
          onSubscriptionChange(false);
          toast({ title: "Notifications désactivées", description: "Vous pouvez réactiver les notifications via les paramètres de votre navigateur."});
        } else {
          // Déclenche la demande d'autorisation native
          await OneSignal.showSlidedownPrompt();
          // L'événement 'subscriptionChange' s'occupera de la mise à jour de l'état et de la BDD.
        }
    } catch(e) {
        console.error("Error with OneSignal subscription:", e);
        toast({ title: "Erreur de souscription", description: "Impossible de modifier l'état des notifications.", variant: "destructive"})
    }
  };

  return { isSubscribed, handleSubscription };
}
