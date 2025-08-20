
'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ShieldCheck, Users, Globe, Home, Shield, Trophy, Footprints } from "lucide-react";
import Image from "next/image";
import type { Role } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { signOut } from "@/app/actions";

interface HeaderProps {
    children?: React.ReactNode;
    onAuthClick?: () => void;
}

export default function Header({ children, onAuthClick }: HeaderProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [role, setRole] = useState<Role>('player');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userIsLoggedIn = !!session;
        setIsLoggedIn(userIsLoggedIn);
        // This is a simplified role check. You might want to have a more robust one.
        if (userIsLoggedIn && (session?.user?.email?.endsWith('@coach.com') || session?.user?.email === 'g.pevrier@gmail.com' )) {
             setRole('coach');
        } else {
            setRole('player');
        }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        const userIsLoggedIn = !!session;
        setIsLoggedIn(userIsLoggedIn);
         if (userIsLoggedIn && (session?.user?.email?.endsWith('@coach.com') || session?.user?.email === 'g.pevrier@gmail.com')) {
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
    await signOut();
    toast({ title: "Déconnexion", description: "Vous avez été déconnecté." });
    router.push('/');
  };


  return (
    <header className="flex items-center justify-between p-2 border-b bg-card">
      <div className="flex items-center gap-3">
        <Link href="/" aria-label="Retour à l'accueil">
            <Image 
                src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png" 
                alt="Club Logo" 
                width={40} 
                height={40} 
                className="rounded-sm"
            />
        </Link>
      </div>
      <div className="flex items-center gap-2">
      {children}
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
               <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Accueil</span>
                </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
               <Link href="/matches">
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Matchs</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <Link href="/trainings">
                  <Footprints className="mr-2 h-4 w-4" />
                  <span>Entraînements</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
               <Link href="/admin/players">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Effectif</span>
                </Link>
            </DropdownMenuItem>
             {role === 'coach' && (
                <DropdownMenuItem asChild>
                    <Link href="/admin/opponents">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Équipes adverses</span>
                    </Link>
                </DropdownMenuItem>
             )}
          <DropdownMenuSeparator />
          {isLoggedIn ? (
              <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
              </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onAuthClick}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Connexion</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
