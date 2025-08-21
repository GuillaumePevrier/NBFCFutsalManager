
'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(userId: string | undefined) {
    const supabase = createClient();
    const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!userId) {
            // If user logs out, leave the channel
            if (presenceChannelRef.current) {
                presenceChannelRef.current.untrack();
                presenceChannelRef.current = null;
            }
            return;
        }

        // Avoid re-creating channel if it already exists for this user
        if (presenceChannelRef.current?.topic === `realtime:presences`) {
            return;
        }

        const channel = supabase.channel('presences', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });
        
        channel
            .on('presence', { event: 'sync' }, () => {
                // This event is fired when the client successfully joins the channel
                // and gets the initial presence state.
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Client is now subscribed, track their presence
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        presenceChannelRef.current = channel;

        // Set up an interval to update presence periodically
        const interval = setInterval(async () => {
            if (presenceChannelRef.current && presenceChannelRef.current.state === 'joined') {
                await presenceChannelRef.current.track({ online_at: new Date().toISOString() });
            }
        }, 60000); // every minute

        return () => {
            clearInterval(interval);
            if (presenceChannelRef.current) {
                presenceChannelRef.current.untrack();
                supabase.removeChannel(presenceChannelRef.current);
                presenceChannelRef.current = null;
            }
        };
    }, [userId, supabase]);
}
