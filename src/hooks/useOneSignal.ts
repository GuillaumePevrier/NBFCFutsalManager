'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { saveOneSignalId } from '@/app/actions';

// Déclare OneSignal pour TypeScript car il est chargé depuis un script externe
declare const window: any;

export function useOneSignal() {
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
        return;
    }

    const initOneSignal = async (userId?: string) => {
        console.log("Initializing OneSignal...");
        
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async function(OneSignal: any) {
            if (window.__OS_INIT__) return;
            window.__OS_INIT__ = true;

            await OneSignal.init({
                appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
                allowLocalhostAsSecureOrigin: true,
                // Le notifyButton est activé par défaut via la cloche
            });
            
            console.log("OneSignal initialized.");

            // Associer l'utilisateur Supabase à l'utilisateur OneSignal
            if (userId) {
                console.log(`Logging in to OneSignal with external_user_id: ${userId}`);
                await OneSignal.login(userId);
            }

            // Gérer les changements d'abonnement
            OneSignal.Notifications.addEventListener('change', async () => {
                console.log("OneSignal Notifications permission changed.");
                const onesignalId = OneSignal.User.onesignalId;
                const isSubscribed = OneSignal.Notifications.permission;
                console.log(`Subscription status: ${isSubscribed}, OneSignal ID: ${onesignalId}`);
                await saveOneSignalId(isSubscribed ? onesignalId : null);
            });
            
            // Si l'utilisateur est déjà abonné au chargement de la page, on sauvegarde son ID
            if (OneSignal.Notifications.permission && OneSignal.User.onesignalId) {
                console.log("User is already subscribed, syncing ID.");
                await saveOneSignalId(OneSignal.User.onesignalId);
            }
        });
    };

    const handleAuthChange = async (event: string, session: any) => {
        const user = session?.user;
        if (event === 'SIGNED_IN' || (event === 'INITIAL_STATE' && user)) {
            if (!initialized.current) {
                initialized.current = true;
                await initOneSignal(user.id);
            }
        } else if (event === 'SIGNED_OUT') {
            if (window.OneSignal) {
                console.log("Logging out from OneSignal.");
                window.OneSignal.logout();
            }
            initialized.current = false;
        }
    };

    supabase?.auth.getSession().then(({ data: { session } }) => {
        handleAuthChange('INITIAL_STATE', session);
    });

    const { data: authListener } = supabase?.auth.onAuthStateChange(handleAuthChange) ?? { data: { subscription: null } };

    return () => {
        authListener?.subscription?.unsubscribe();
    };

  }, [supabase]);
}
