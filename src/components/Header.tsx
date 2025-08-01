
'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import type { Role } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
    children?: React.ReactNode;
    onCoachClick?: () => void;
}

export default function Header({ children, onCoachClick }: HeaderProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [role, setRole] = useState<Role>('player');

  useEffect(() => {
    const checkRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setRole(session ? 'coach' : 'player');
    };
    checkRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        const newRole = session ? 'coach' : 'player';
        setRole(newRole);
        if (newRole === 'player' && window.location.pathname.startsWith('/admin')) {
            router.push('/');
        }
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast({ title: "Erreur", description: "Impossible de se déconnecter.", variant: "destructive" });
    } else {
        toast({ title: "Déconnecté", description: "Vous êtes repassé en mode joueur." });
        router.push('/');
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
          <DropdownMenuItem>
             <a href="https://futsal.noyalbrecefc.com/" target="_blank" rel="noopener noreferrer" className="w-full">
                Site du Club
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {role === 'coach' ? (
            <>
              <Link href="/admin/players" passHref legacyBehavior>
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Gérer les joueurs</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={onCoachClick}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Mode Coach</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
