
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveOneSignalId } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

declare const window: any;

export default function NotificationButton() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();


  const updateSubscriptionStatus = useCallback(async () => {
    if (!window.OneSignal) return;
    setIsLoading(true);
    const permission = await window.OneSignal.Notifications.getPermission();
    setIsSubscribed(permission === 'granted');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!window.OneSignal) return;
      await updateSubscriptionStatus();

      // Listener for when the user's subscription state changes
      const onSubscriptionChange = async () => {
        await updateSubscriptionStatus();
        const onesignalId = window.OneSignal.User.PushSubscription.id;
        console.log("New OneSignal ID:", onesignalId);
        await saveOneSignalId(onesignalId || null);
      };
      
      window.OneSignal.Notifications.addEventListener('change', onSubscriptionChange);

      return () => {
        window.OneSignal.Notifications.removeEventListener('change', onSubscriptionChange);
      };
    }
    
    // OneSignal is initialized in the global layout
    window.OneSignalDeferred.push(init);
  }, [updateSubscriptionStatus]);

  const handleSubscriptionClick = async () => {
    if (!window.OneSignal) {
        toast({ title: "Erreur", description: "OneSignal n'est pas encore prêt.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);
    
    try {
        const permission = await window.OneSignal.Notifications.getPermission();
        if (permission === 'granted') {
            // If already subscribed, opt out.
            await window.OneSignal.User.PushSubscription.optOut();
            toast({ title: "Notifications désactivées", description: "Vous ne recevrez plus de notifications." });
        } else {
            // Otherwise, request permission.
            await window.OneSignal.Notifications.requestPermission();
        }
    } catch (error) {
        console.error("Error managing subscription:", error);
        toast({ title: "Erreur", description: "Impossible de modifier votre abonnement.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const buttonText = isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications';
  const buttonVariant = isSubscribed ? 'destructive' : 'default';

  return (
    <Button onClick={handleSubscriptionClick} disabled={isLoading || isProcessing} variant={buttonVariant} className="w-full">
      {(isLoading || isProcessing) ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Bell className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Chargement..." : buttonText}
    </Button>
  );
}
