
'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ShieldCheck, Bell } from "lucide-react";
import Image from "next/image";
import type { Role } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";


interface HeaderProps {
    onCoachClick: () => void;
    children?: React.ReactNode;
    role: Role;
}

export default function Header({ onCoachClick, children, role }: HeaderProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast({ title: "Erreur", description: "Impossible de se déconnecter.", variant: "destructive" });
    } else {
        toast({ title: "Déconnecté", description: "Vous êtes repassé en mode joueur." });
        router.refresh();
    }
  };

  const handleNotificationSubscription = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (isIOS) {
             toast({ 
                title: "Notifications sur iPhone", 
                description: "Pour activer les notifications, ajoutez d'abord ce site à votre écran d'accueil depuis le menu de partage de Safari.", 
                variant: "default", 
                duration: 10000 
            });
        } else {
            toast({ title: "Fonctionnalité non supportée", description: "Votre navigateur ne supporte pas les notifications push.", variant: "destructive" });
        }
        return;
    }

    try {
        await navigator.serviceWorker.register('/sw.js');
        const swRegistration = await navigator.serviceWorker.ready;
        
        let subscription = await swRegistration.pushManager.getSubscription();
        
        if (subscription === null) {
            if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
                console.error("VAPID public key not found");
                toast({ title: "Erreur de configuration", description: "La clé de notification est manquante.", variant: "destructive" });
                return;
            }

            subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            });
            
            console.log('New push subscription:', subscription);

            const { error } = await supabase.from('subscriptions').insert({ subscription_object: subscription });
            if(error) {
                console.error("Failed to save subscription", error);
                toast({ title: "Erreur", description: "Impossible de sauvegarder l'abonnement.", variant: "destructive" });
            } else {
                toast({ title: "Notifications Activées", description: "Vous recevrez maintenant les mises à jour." });
            }
        } else {
            console.log('Existing push subscription:', subscription);
            toast({ title: "Notifications Déjà Activées", description: "Vous êtes déjà abonné." });
        }
    } catch (error) {
        console.error('Failed to subscribe to push notifications', error);
        toast({ title: "Erreur de Notification", description: "Impossible d'activer les notifications. Assurez-vous d'avoir autorisé les notifications pour ce site dans les réglages de votre navigateur.", variant: "destructive", duration: 10000 });
    }
  };

  return (
    <header className="flex items-center justify-between p-2 border-b bg-card">
      <div className="flex items-center gap-3">
        <Image 
            src="/logo.png" 
            alt="Club Logo" 
            width={40} 
            height={40} 
            className="rounded-sm"
        />
      </div>
      <div className="flex items-center gap-2">
      {children}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleNotificationSubscription}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Activer les notifications</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {role === 'coach' ? (
             <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onCoachClick}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Mode Coach</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="https://futsal.noyalbrecefc.com/" target="_blank" rel="noopener noreferrer">
                Site du Club
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
