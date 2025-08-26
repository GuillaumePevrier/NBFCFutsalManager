
'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { onMessageListener } from '@/lib/firebase';
import { createClient } from '@/lib/supabase/client';

export default function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { init } = usePushNotifications();
  const { toast } = useToast();
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
    
    supabase?.auth.getSession().then(({ data: { session } }) => {
        if(session) setupInitialSubscription(session);
    });

    const { data: authListener } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setupInitialSubscription(session);
      }
    }) ?? { data: null };
    
    return () => {
        authListener?.subscription.unsubscribe();
    };

  }, [init, supabase]);


  useEffect(() => {
    onMessageListener()
      .then((payload: any) => {
        if (payload?.notification) {
          toast({
              title: payload.notification.title,
              description: payload.notification.body
          })
        }
      })
      .catch((err) => console.log('Failed to listen for foreground messages: ', err));
  }, [toast]);

  return <>{children}</>;
}
