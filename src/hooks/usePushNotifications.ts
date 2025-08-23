
// src/hooks/usePushNotifications.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsPushSupported(true);
      setPermissionStatus(Notification.permission);

      const checkSubscription = async () => {
        const swRegistration = await navigator.serviceWorker.ready;
        const sub = await swRegistration.pushManager.getSubscription();
        if (sub) {
          setIsSubscribed(true);
        }
      };
      checkSubscription();
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.error("Push notifications not supported or VAPID key missing.");
      return false;
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      let sub = await swRegistration.pushManager.getSubscription();

      if (!sub) {
        // This will trigger the browser's permission prompt
        const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
        sub = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }
      
      // Update permission status after the prompt
      setPermissionStatus(Notification.permission);
      
      // If permission is denied, we can't proceed
      if (Notification.permission === 'denied') {
        toast({
          title: "Permissions bloquées",
          description: "Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres de votre navigateur.",
          variant: "destructive",
        });
        return false;
      }
      
      const result = await savePushSubscription(sub.toJSON());

      if (result.success) {
        toast({
          title: "Notifications activées !",
          description: "Vous recevrez désormais les mises à jour importantes.",
        });
        setIsSubscribed(true);
        return true;
      } else {
        toast({
          title: "Erreur d'enregistrement",
          description: result.error || "L'enregistrement de l'abonnement a échoué.",
          variant: "destructive",
        });
        // If saving fails, we should unsubscribe to avoid a broken state
        await sub.unsubscribe();
        return false;
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications", error);
      const currentPermission = Notification.permission;
      setPermissionStatus(currentPermission);
      
      if (currentPermission === 'denied') {
        toast({
          title: "Permissions bloquées",
          description: "Vous avez bloqué les notifications. Veuillez les autoriser dans les paramètres de votre navigateur pour ce site.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Erreur d'activation",
          description: "Une erreur est survenue lors de l'activation des notifications.",
          variant: "destructive",
        });
      }
      return false;
    }
  }, [isPushSupported, toast]);

  const unsubscribeFromPush = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported) return false;

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const sub = await swRegistration.pushManager.getSubscription();

      if (sub) {
        // We tell our server first, then unsubscribe from the browser's push service
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
        setIsSubscribed(false);
        toast({ title: "Notifications désactivées" });
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
  }, [isPushSupported, toast]);

  return {
    isSubscribed,
    isPushSupported,
    permissionStatus,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
