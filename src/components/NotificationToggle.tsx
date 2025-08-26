
'use client';

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function NotificationToggle() {
    const {
        isSubscribed,
        subscribe,
        unsubscribe,
        permissionStatus,
        isPushSupported,
        isInitializing
    } = usePushNotifications();

    if (!isPushSupported) {
        return null; // Don't render the button if push is not supported
    }

    const handleClick = () => {
        if (isSubscribed) {
            unsubscribe();
        } else {
            subscribe();
        }
    }
    
    const getTooltipContent = () => {
        if (permissionStatus === 'denied') {
            return "Notifications bloquées par le navigateur";
        }
        if (isSubscribed) {
            return "Désactiver les notifications";
        }
        return "Activer les notifications";
    }

    const renderIcon = () => {
        if (isInitializing) {
            return <Loader2 className="animate-spin" />;
        }
        if (permissionStatus === 'denied') {
            return <BellOff className="text-destructive" />;
        }
        if (isSubscribed) {
            return <BellRing className="text-green-500" />;
        }
        return <Bell />;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleClick}
                        disabled={permissionStatus === 'denied' || isInitializing}
                        className="h-8 w-8 btn neon-blue-sm"
                    >
                       {renderIcon()}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipContent()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
