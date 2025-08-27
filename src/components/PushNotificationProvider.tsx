
'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createClient } from '@/lib/supabase/client';

export default function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { init } = usePushNotifications();
  const supabase = createClient();

  useEffect(() => {
    // On initial load, check if the user is logged in and if we should
    // try to silently re-establish the push subscription.
    const setupInitialSubscription = async (session: any) => {
        if (session?.user) {
            // init() will check permissions and subscribe if already granted.
            await init();
        }
    };
    
    // Only attempt to initialize if supabase client is available
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if(session) setupInitialSubscription(session);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN') {
            setupInitialSubscription(session);
          }
        });
        
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }

  }, [init, supabase]);
  
  // The onMessageListener logic is now handled inside usePushNotifications
  // to ensure it only runs when firebase is correctly initialized and a subscription exists.

  return <>{children}</>;
}
