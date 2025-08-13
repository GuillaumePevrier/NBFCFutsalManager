
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import type { Role } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function Home() {
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const supabase = createClient();
  
  useEffect(() => {
    const checkRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setRole(session ? 'coach' : 'player');
    };
    checkRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
        setRole(session ? 'coach' : 'player');
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      
      <main className="flex-grow relative">
        <div className="absolute inset-0 w-full h-full">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
            src="https://futsal.noyalbrecefc.com/wp-content/uploads/2025/07/telechargement-1.mp4"
          >
            Votre navigateur ne supporte pas la vidéo.
          </video>
        </div>
      </main>
    </div>
  );
}
