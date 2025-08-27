
'use client';

import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { createClient } from '@/lib/supabase/client';

export default function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { init } = usePushNotifications();
  const supabase = createClient();

  useEffect(() => {
    // This effect now simply ensures that the initialization logic
    // in usePushNotifications runs when the user's auth state is known.
    
    // Only attempt to initialize if supabase client is available
    if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if(session) init(); // init if already logged in
        });
    }

  }, [init, supabase]);
  
  return <>{children}</>;
}
