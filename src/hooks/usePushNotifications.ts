
// src/hooks/usePushNotifications.ts
'use client';

import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { savePushSubscription, deletePushSubscription } from '@/app/actions';

// This function is needed to convert the VAPID key to the correct format
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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSubscriptionAndPermission() {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setPermissionStatus(Notification.permission);
        const swRegistration = await navigator.serviceWorker.ready;
        const sub = await swRegistration.pushManager.getSubscription();
        if (sub) {
          setIsSubscribed(true);
          setSubscription(sub);
        }
      }
      setIsLoading(false);
    }
    checkSubscriptionAndPermission();
  }, []);

  const subscribeToPush = async (): Promise<boolean> => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("VAPID public key not found.");
      toast({
          title: "Erreur de configuration",
          description: "La clé de notification n'est pas configurée.",
          variant: "destructive",
        });
      return false;
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      let sub = await swRegistration.pushManager.getSubscription();

      if (!sub) {
        const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
        sub = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }
      
      const result = await savePushSubscription(sub.toJSON());
      setPermissionStatus(Notification.permission);

      if (result.success) {
        toast({
          title: "Notifications activées !",
          description: "Vous recevrez désormais les mises à jour importantes.",
        });
        setIsSubscribed(true);
        setSubscription(sub);
        return true;
      } else {
        toast({
          title: "Erreur",
          description: "L'abonnement aux notifications a échoué. " + result.error,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications", error);
       setPermissionStatus(Notification.permission);
       if (Notification.permission === 'denied') {
            toast({
              title: "Permissions bloquées",
              description: "Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres de votre navigateur pour ce site.",
              variant: "destructive",
              duration: 10000,
            });
       } else {
           toast({
            title: "Erreur",
            description: "L'activation des notifications a échoué.",
            variant: "destructive",
          });
       }
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const sub = await swRegistration.pushManager.getSubscription();

      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
        setIsSubscribed(false);
        setSubscription(null);
        toast({
          title: "Notifications désactivées",
        });
        return true;
      }
      return true; // Already unsubscribed
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications", error);
      toast({
        title: "Erreur",
        description: "La désactivation des notifications a échoué.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    isSubscribed,
    isLoading,
    permissionStatus,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
