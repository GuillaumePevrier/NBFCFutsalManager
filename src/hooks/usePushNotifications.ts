
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { savePushSubscription, deletePushSubscription } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { toast } = useToast();
  const supabase = createClient();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isPushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  const init = useCallback(async () => {
    setIsLoading(true);
    if (!isPushSupported) {
        setIsLoading(false);
        return;
    };
    
    setPermissionStatus(Notification.permission);
    
    // Only try to get subscription if permission is already granted
    if (Notification.permission === 'granted') {
        try {
          const swRegistration = await navigator.serviceWorker.ready;
          const sub = await swRegistration.pushManager.getSubscription();
          setSubscription(sub);
          setIsSubscribed(!!sub);
        } catch (error) {
          console.error("Error getting service worker or subscription:", error);
          setIsSubscribed(false);
          setSubscription(null);
        }
    }
    
    setIsLoading(false);
  }, [isPushSupported]);

  useEffect(() => {
    // We only initialize if the user is logged in.
    const checkUserAndInit = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await init();
        } else {
            setIsLoading(false); // Not logged in, stop loading
        }
    };
    checkUserAndInit();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if(event === 'SIGNED_IN') {
             checkUserAndInit();
        }
        if (event === 'SIGNED_OUT') {
            setIsSubscribed(false);
            setSubscription(null);
            setPermissionStatus('default');
            setIsLoading(false);
        }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };

  }, [supabase, init]);

  const subscribe = useCallback(async () => {
    setIsActionLoading(true);
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
      console.error("VAPID public key is not defined.");
      toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive"});
      setIsActionLoading(false);
      return;
    }

    if (!isPushSupported) {
      toast({ title: "Erreur", description: "Les notifications ne sont pas supportées.", variant: "destructive"});
       setIsActionLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Action requise", description: "Veuillez vous connecter pour activer les notifications.", variant: "destructive"});
       setIsActionLoading(false);
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
          toast({
              title: permission === 'denied' ? "Permissions refusées" : "Activation annulée",
              description: permission === 'denied' ? "Vous avez bloqué les notifications." : "Vous n'avez pas accordé la permission.",
              variant: 'destructive'
          });
          setIsActionLoading(false);
          return;
      }
      
      const swRegistration = await navigator.serviceWorker.ready;
      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY),
      });

      const result = await savePushSubscription(sub.toJSON());

      if (result.success) {
        toast({
          title: "Notifications activées !",
          description: "Vous recevrez désormais les mises à jour importantes.",
        });
        setSubscription(sub);
        setIsSubscribed(true);
      } else {
        toast({
          title: "Erreur d'enregistrement",
          description: result.error || "L'enregistrement de l'abonnement a échoué. Assurez-vous d'être connecté et réessayez.",
          variant: "destructive",
        });
        await sub.unsubscribe(); // Clean up the failed subscription
      }
    } catch (error: any) {
      console.error("Failed to subscribe to push notifications", error);
      toast({
            title: "Erreur d'activation",
            description: error.message || "Une erreur est survenue.",
            variant: "destructive",
      });
      setIsSubscribed(false);
      setSubscription(null);
    } finally {
        setIsActionLoading(false);
    }
  }, [isPushSupported, toast, supabase]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    setIsActionLoading(true);

    try {
      // Unsubscribe from the push manager first
      const successfulUnsubscribe = await subscription.unsubscribe();
      
      if(successfulUnsubscribe) {
          // Then delete the record from our DB
          await deletePushSubscription(subscription.endpoint);
          setSubscription(null);
          setIsSubscribed(false);
          toast({ title: "Notifications désactivées" });
      } else {
          throw new Error("La désinscription du navigateur a échoué.");
      }
    } catch (error: any) {
      console.error("Failed to unsubscribe from push notifications", error);
      toast({
        title: "Erreur",
        description: error.message || "La désactivation des notifications a échoué.",
        variant: "destructive",
      });
    } finally {
        setIsActionLoading(false);
    }
  }, [subscription, toast]);

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    permissionStatus,
    isPushSupported,
    isLoading,
    isActionLoading,
    init,
  };
}
