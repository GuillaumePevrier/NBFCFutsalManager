
'use client';

import { useEffect, useState } from 'react';
import { onMessageListener, requestForToken } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { saveFcmToken } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';

export default function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const handleTokenRequest = async (userId: string) => {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await requestForToken();
        if (token) {
          await saveFcmToken(token);
        }
      }
    };

    const setupNotifications = async (session: any) => {
        if (session?.user) {
            handleTokenRequest(session.user.id);
        }
    };
    
    // Initial check
    supabase?.auth.getSession().then(({ data: { session } }) => {
        if(session) setupNotifications(session);
    });

    // Listen for auth changes
    const { data: authListener } = supabase?.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setupNotifications(session);
      }
    }) ?? { data: null };
    
    return () => {
        authListener?.subscription.unsubscribe();
    };

  }, [supabase]);


  useEffect(() => {
    onMessageListener()
      .then((payload: any) => {
        if (payload) {
          setNotification({
            title: payload.notification.title,
            body: payload.notification.body,
          });
          toast({
              title: payload.notification.title,
              description: payload.notification.body
          })
        }
      })
      .catch((err) => console.log('failed: ', err));
  }, [toast]);

  return <>{children}</>;
}
