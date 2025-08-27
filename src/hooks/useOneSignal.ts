
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

  // Fonction pour mettre à jour la BDD, appelée par l'événement `subscriptionChange`
  const onSubscriptionChange = useCallback(async (subscribed: boolean) => {
    console.log("OneSignal Subscription changed:", subscribed);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // OneSignal.getUserId() retourne null si l'utilisateur n'est pas abonné
      const onesignalId = await OneSignal.getUserId();
      await saveOneSignalId(user.id, onesignalId);
    }
    
    setIsSubscribed(subscribed);
  }, [supabase.auth]);


  useEffect(() => {
    if (isInitialized.current || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      return;
    }

    const initOneSignal = async () => {
      isInitialized.current = true;
      
      await OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { 
            enable: false,
        }
      });
      
      console.log('OneSignal initialized.');

      // Après l'init, on vérifie l'état actuel et on met à jour notre state React
      const isCurrentlySubscribed = await OneSignal.isPushNotificationsEnabled();
      setIsSubscribed(isCurrentlySubscribed);
      
      // On attache l'écouteur d'événement pour les changements futurs
      OneSignal.on('subscriptionChange', onSubscriptionChange);
    };

    if (typeof window !== 'undefined') {
      initOneSignal();
    }

    // Le nettoyage se fait via la fonction retournée par `OneSignal.on`
    return () => {
        // La librairie react-onesignal ne fournit pas de méthode de nettoyage explicite pour `off`.
        // La gestion se fait au niveau du cycle de vie du composant.
    };
  }, [onSubscriptionChange]);

  // Associer/Dissocier l'utilisateur externe lors de la connexion/déconnexion
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
        if (!isInitialized.current) return;

        if (event === 'SIGNED_IN' && session?.user) {
            await OneSignal.setExternalUserId(session.user.id);
        } else if (event === 'SIGNED_OUT') {
            await OneSignal.removeExternalUserId();
        }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleAuthChange(event, session);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // La fonction que le bouton "cloche" appellera
  const handleSubscription = async () => {
    if (!isInitialized.current) {
        toast({ title: "OneSignal non prêt", description: "Veuillez patienter quelques instants.", variant: "destructive"});
        return;
    }

    try {
        const isEnabled = await OneSignal.isPushNotificationsEnabled();
        if (isEnabled) {
          // Pour désactiver, l'utilisateur doit utiliser les paramètres du navigateur.
          // On peut simuler la désactivation dans notre UI.
          await OneSignal.setSubscription(false);
          onSubscriptionChange(false);
          toast({ title: "Notifications désactivées", description: "Vous pouvez réactiver les notifications via les paramètres de votre navigateur."});
        } else {
          // L'activation est gérée par le prompt natif ou le slidedown de OneSignal
          await OneSignal.setSubscription(true);
        }
    } catch(e) {
        console.error("Error with OneSignal subscription:", e);
        toast({ title: "Erreur de souscription", description: "Impossible de modifier l'état des notifications.", variant: "destructive"})
    }
  };

  return { isSubscribed, handleSubscription };
}
