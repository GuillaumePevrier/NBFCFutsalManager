
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
import { cn } from "@/lib/utils";

export default function NotificationToggle() {
    const {
        isSubscribed,
        subscribe,
        unsubscribe,
        permissionStatus,
        isPushSupported,
        isLoading,
        isActionLoading
    } = usePushNotifications();

    if (!isPushSupported || isLoading) {
        return (
             <Button variant="outline" size="icon" disabled className="h-8 w-8 btn neon-blue-sm">
                <Loader2 className="animate-spin" />
             </Button>
        );
    }

    const handleClick = () => {
        if (isActionLoading) return;
        if (isSubscribed) {
            unsubscribe();
        } else {
            subscribe();
        }
    }
    
    const getTooltipContent = () => {
        if (isActionLoading) {
            return isSubscribed ? "Désabonnement..." : "Abonnement...";
        }
        if (permissionStatus === 'denied') {
            return "Notifications bloquées par le navigateur";
        }
        if (isSubscribed) {
            return "Désactiver les notifications";
        }
        return "Activer les notifications";
    }

    const renderIcon = () => {
        if (isActionLoading) {
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
                        disabled={permissionStatus === 'denied' || isActionLoading}
                        className={cn("h-8 w-8 btn neon-blue-sm", isSubscribed && "border-green-500/50 hover:border-green-500/80")}
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
