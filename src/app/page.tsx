
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import type { Role } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';


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
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      
       <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        <div className="fixed inset-0 w-full h-full -z-10">
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
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto text-center z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground">
                Bienvenue sur <span className="text-primary">NBFC Futsal Manager</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Votre outil tout-en-un pour la gestion tactique et le suivi des matchs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/80 backdrop-blur-sm border-border text-foreground hover:border-primary transition-colors">
                    <CardHeader>
                        <CardTitle>Suivi des Matchs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Accédez aux scores, chronomètres et compositions en direct.</p>
                        <Button asChild>
                            <Link href="/matches">Voir les matchs <ArrowRight className="ml-2" /></Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="bg-card/80 backdrop-blur-sm border-border text-foreground hover:border-primary transition-colors">
                    <CardHeader>
                        <CardTitle>Gestion de l'Effectif</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Consultez les fiches et statistiques de tous les joueurs.</p>
                         <Button asChild>
                            <Link href="/admin/players">Voir l'effectif <ArrowRight className="ml-2" /></Link>
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="bg-card/80 backdrop-blur-sm border-border text-foreground hover:border-primary transition-colors">
                    <CardHeader>
                        <CardTitle>Équipes Adverses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Gérez les informations sur les équipes que vous affrontez.</p>
                         <Button asChild>
                            <Link href="/admin/opponents">Voir les adversaires <ArrowRight className="ml-2" /></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
