
'use client';

import { useOneSignal } from '@/hooks/useOneSignal';
import { Button } from './ui/button';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
    const { isSubscribed, handleSubscription, isLoading, isProcessing } = useOneSignal();

    if (isLoading) {
        return (
             <Button variant="outline" size="icon" disabled className="h-8 w-8 btn">
                <Bell className="h-5 w-5 animate-pulse" />
             </Button>
        )
    }

    return (
        <Button 
            variant="outline" 
            size="icon" 
            className={cn(
                "h-8 w-8 btn",
                isSubscribed ? "neon-green-sm" : "neon-red-sm"
            )}
            onClick={handleSubscription}
            disabled={isProcessing}
            title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications"}
        >
            <Bell className={cn("h-5 w-5", isSubscribed ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500")} />
        </Button>
    )
}
