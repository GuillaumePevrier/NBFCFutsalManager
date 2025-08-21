
'use client';

import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ShieldCheck, Users, Globe, Home, Shield, Trophy, Footprints, MessageSquare, Bell, BellOff } from "lucide-react";
import Image from "next/image";
import type { Role } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/app/actions";
import AuthDialog from "./AuthDialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ToastAction } from "./ui/toast";
import { cn } from "@/lib/utils";

interface HeaderProps {
    children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [role, setRole] = useState<Role>('player');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  const { isSubscribed, subscribeToPush, unsubscribeFromPush, isLoading: isPushLoading, permissionStatus } = usePushNotifications();

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userIsLoggedIn = !!session;
        setIsLoggedIn(userIsLoggedIn);
        if (userIsLoggedIn && session?.user?.email === 'guillaumepevrier@gmail.com' ) {
             setRole('coach');
        } else {
            setRole('player');
        }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        const userIsLoggedIn = !!session;
        setIsLoggedIn(userIsLoggedIn);
         if (userIsLoggedIn && session?.user?.email === 'guillaumepevrier@gmail.com') {
             setRole('coach');
        } else {
            setRole('player');
        }
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    // Unsubscribe from push notifications before signing out
    if(isSubscribed) {
      await unsubscribeFromPush();
    }
    await signOut();
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté." });
    router.push('/');
  };
  
  const onAuthenticated = () => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userIsLoggedIn = !!session;
        setIsLoggedIn(userIsLoggedIn);
        if (userIsLoggedIn && session?.user?.email === 'guillaumepevrier@gmail.com' ) {
             setRole('coach');
        } else {
            setRole('player');
        }

        // After authentication, check if we should prompt for notifications
        if (userIsLoggedIn && permissionStatus === 'default') {
            toast({
                title: "Restez Connecté !",
                description: "Activez les notifications pour ne rien manquer des convocations et des scores.",
                duration: 10000, // Keep it on screen longer
                action: <ToastAction altText="Activer" onClick={() => subscribeToPush()}>Activer</ToastAction>,
            });
        }
    };
    checkSession();
    setIsAuthOpen(false);
  }

  const handleNotificationToggle = () => {
    if (isSubscribed) {
      unsubscribeFromPush();
    } else {
      subscribeToPush();
    }
  }


  return (
    <>
    <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={onAuthenticated} />
    <header className="flex items-center justify-between p-2 border-b bg-card">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Retour à l'accueil">
            <Image 
                src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png" 
                alt="Club Logo" 
                width={56} 
                height={56} 
                className="rounded-sm w-14 h-14"
            />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {isLoggedIn && !isPushLoading && (
            <Button variant="ghost" size="icon" onClick={handleNotificationToggle} title={isSubscribed ? "Désactiver les notifications" : "Activer les notifications"} className="btn neon-blue-sm">
                {isSubscribed ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5" />}
            </Button>
        )}
        <ThemeToggle />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="btn neon-blue-sm">
                    <Menu className="h-6 w-6" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link href="/"><Home className="mr-2 h-4 w-4" /><span>Accueil</span></Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/matches"><Trophy className="mr-2 h-4 w-4" /><span>Matchs</span></Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/trainings"><Footprints className="mr-2 h-4 w-4" /><span>Entraînements</span></Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/chat"><MessageSquare className="mr-2 h-4 w-4" /><span>Messages</span></Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/admin/players"><Users className="mr-2 h-4 w-4" /><span>Effectif</span></Link></DropdownMenuItem>
                {role === 'coach' && (
                  <>
                    <DropdownMenuItem asChild><Link href="/admin/opponents"><Shield className="mr-2 h-4 w-4" /><span>Équipes adverses</span></Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/admin/notifications"><Bell className="mr-2 h-4 w-4" /><span>Notifications</span></Link></DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                {isLoggedIn ? (
                    <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /><span>Se déconnecter</span></DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => setIsAuthOpen(true)}><ShieldCheck className="mr-2 h-4 w-4" /><span>Connexion</span></DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
