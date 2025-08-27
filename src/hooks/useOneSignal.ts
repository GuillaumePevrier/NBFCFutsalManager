
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { saveOneSignalId } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { useToast } from './use-toast';

// Déclare OneSignal pour TypeScript car il est chargé depuis un script externe
declare const window: any;

export function useOneSignal() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  
  // Utiliser une référence pour stocker l'ID de l'utilisateur actuel
  const currentUserIdRef = useRef<string | null>(null);

  // Mise à jour de l'état d'abonnement local
  const updateSubscriptionStatus = useCallback(async () => {
    if (window.OneSignal) {
      const isEnabled = window.OneSignal.Notifications.permission;
      setIsSubscribed(isEnabled);
    }
  }, []);

  // Logique pour sauvegarder l'ID OneSignal dans la base de données
  const syncSubscription = useCallback(async () => {
    const onesignalId = await window.OneSignal.User.getOnesignalId();
    if (currentUserIdRef.current) {
        await saveOneSignalId(onesignalId);
    }
  }, []);

  // Initialisation de OneSignal et gestion des événements
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || !window.OneSignal) {
        return;
    }
    
    // Fonction d'initialisation asynchrone
    const init = async () => {
        // Prévenir la ré-initialisation
        if (isInitialized) return;

        await window.OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
        });

        setIsInitialized(true);
        console.log('OneSignal Initialized.');
        
        // Mettre à jour le statut initial
        updateSubscriptionStatus();
        
        // Si l'utilisateur est déjà abonné, synchroniser son ID
        if (window.OneSignal.Notifications.permission) {
            syncSubscription();
        }

        // Écouter les changements de permission
        window.OneSignal.Notifications.addEventListener('permissionChange', (permission: boolean) => {
            console.log("OneSignal Permission changed:", permission);
            setIsSubscribed(permission);
            if(permission) {
                syncSubscription();
            } else {
                // L'utilisateur s'est désabonné, on efface son ID
                saveOneSignalId(null);
            }
        });
    };
    
    // OneSignal est chargé via un script, on attend qu'il soit prêt
    window.OneSignal.push(init);

  }, [isInitialized, updateSubscriptionStatus, syncSubscription]);

  // Gérer la connexion et la déconnexion de l'utilisateur
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
        if (!isInitialized) return;

        const userId = session?.user?.id || null;
        currentUserIdRef.current = userId;

        if (event === 'SIGNED_IN' && userId) {
            console.log(`User ${userId} signed in. Logging in to OneSignal.`);
            await window.OneSignal.login(userId);
            // Après connexion, synchroniser l'ID si l'utilisateur est déjà abonné
            if (window.OneSignal.Notifications.permission) {
                syncSubscription();
            }
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out. Logging out from OneSignal.');
            await window.OneSignal.logout();
        }
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        handleAuthChange(event, session);
    });

    // Gérer l'état initial
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange('INITIAL_STATE', session);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [isInitialized, supabase.auth, syncSubscription]);

  // Fonction appelée par le clic sur la cloche
  const handleSubscription = async () => {
    if (!isInitialized) {
        toast({ title: "OneSignal n'est pas prêt", description: "Veuillez patienter quelques instants.", variant: "destructive"});
        return;
    }

    try {
        if (isSubscribed) {
            // La désactivation se fait via les paramètres du navigateur, on ne peut pas la forcer.
            // On peut informer l'utilisateur.
            toast({ title: "Déjà abonné", description: "Pour vous désabonner, veuillez utiliser les paramètres de notifications de votre navigateur."});
        } else {
            // Affiche le prompt natif pour demander l'autorisation
            await window.OneSignal.Notifications.requestPermission();
        }
    } catch(e) {
        console.error("Error with OneSignal subscription:", e);
        toast({ title: "Erreur de souscription", description: "Impossible de modifier l'état des notifications.", variant: "destructive"})
    }
  };

  return { isSubscribed, handleSubscription };
}
