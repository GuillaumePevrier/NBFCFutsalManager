
'use client';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu, ShieldCheck, Users, Globe } from "lucide-react";
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
            src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png" 
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
            <DropdownMenuItem asChild>
               <Link href="/admin/players">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Effectif</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
             <a href="https://futsal.noyalbrecefc.com/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                <span>Site du Club</span>
            </a>
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
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
