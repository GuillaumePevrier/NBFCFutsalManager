
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { savePushSubscription, deletePushSubscription } from '@/app/actions';

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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    const checkSupportAndSubscription = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        setIsPushSupported(true);
        setPermissionStatus(Notification.permission);
        const swRegistration = await navigator.serviceWorker.ready;
        const sub = await swRegistration.pushManager.getSubscription();
        setSubscription(sub);
        setIsSubscribed(!!sub);
      }
    };
    checkSupportAndSubscription();
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!isPushSupported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("Push notifications not supported or VAPID key missing.");
      toast({ title: "Erreur", description: "Les notifications ne sont pas supportées sur cet appareil ou navigateur.", variant: "destructive"});
      return;
    }

    if (Notification.permission === 'denied') {
      toast({
        title: "Permissions bloquées",
        description: "Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres de votre navigateur pour ce site.",
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      
      const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
      // This is where the browser's permission prompt is triggered
      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
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
          description: result.error || "L'enregistrement de l'abonnement a échoué.",
          variant: "destructive",
        });
        await sub.unsubscribe(); // Clean up failed subscription
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications", error);
      // This will catch if the user clicks "Block" on the permission prompt
      if (Notification.permission === 'denied') {
          toast({
              title: "Activation annulée",
              description: "Vous avez refusé les notifications. Vous pouvez les réactiver plus tard dans les paramètres du site.",
              variant: "destructive"
          });
      } else {
          toast({
              title: "Erreur d'activation",
              description: "Une erreur est survenue lors de l'activation des notifications.",
              variant: "destructive",
          });
      }
      setIsSubscribed(false);
      setSubscription(null);
    }
  }, [isPushSupported, toast]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return;

    try {
      await deletePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      toast({ title: "Notifications désactivées" });
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications", error);
      toast({
        title: "Erreur",
        description: "La désactivation des notifications a échoué.",
        variant: "destructive",
      });
    }
  }, [subscription, toast]);

  return {
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    isPushSupported,
    permissionStatus,
  };
}
