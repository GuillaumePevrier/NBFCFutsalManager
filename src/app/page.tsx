
'use client';

import { useState, useEffect } from 'react';
import type { Match, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { PlusCircle, Eye, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FUTSAL_PERIOD_DURATION = 20 * 60; // 20 minutes in seconds

const FoulDisplay = ({ count }: { count: number }) => (
    <div className="flex items-center gap-1">
      <span className="text-xs font-semibold text-muted-foreground mr-1">Fautes:</span>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 w-4 rounded-sm',
              i < count ? 'bg-destructive' : 'bg-destructive/20'
            )}
          />
        ))}
      </div>
    </div>
  );

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const createDemoMatch = async () => {
    const demoMatch: Omit<Match, 'id' | 'created_at'> = {
      details: {
        opponent: 'Équipe de Démo',
        date: new Date().toISOString().split('T')[0],
        time: '21:00',
        location: 'Gymnase de Démo',
        remarks: 'Ceci est un match de démonstration. Vous pouvez le modifier ou le supprimer.',
      },
      team: [],
      substitutes: [],
      scoreboard: {
        homeScore: 2,
        awayScore: 1,
        homeFouls: 3,
        awayFouls: 4,
        time: FUTSAL_PERIOD_DURATION - 300,
        isRunning: false,
        period: 1,
      },
    };
    const { data, error } = await supabase.from('matches').insert(demoMatch).select().single();
    if(error) {
        console.error("Error creating demo match", error);
    }
    return data;
  };

  useEffect(() => {
    const loadMatches = async () => {
        const { data: loadedMatches, error } = await supabase
            .from('matches')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Failed to fetch matches from Supabase", error);
            setMatches([]);
        } else if (loadedMatches.length === 0 && role === 'coach') {
            console.log("No matches found, creating a demo match.");
            const demoMatch = await createDemoMatch();
            if(demoMatch) setMatches([demoMatch]);
        } else {
            setMatches(loadedMatches);
        }
    };
    
    if(role) loadMatches();

    const channel = supabase
      .channel('matches_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        loadMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [supabase, role]);

  useEffect(() => {
    const checkRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setRole('coach');
        } else {
            setRole('player');
        }
    };
    checkRole();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        setRole(session ? 'coach' : 'player');
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
}, [supabase.auth]);

  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  };

  const createNewMatch = async () => {
    const newMatchData: Omit<Match, 'id' | 'created_at'> = {
      details: {
        opponent: 'Nouvel Adversaire',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        location: 'Lieu à définir',
        remarks: '',
      },
      team: [],
      substitutes: [],
      scoreboard: {
        homeScore: 0,
        awayScore: 0,
        homeFouls: 0,
        awayFouls: 0,
        time: FUTSAL_PERIOD_DURATION,
        isRunning: false,
        period: 1,
      },
    };

    const { data: newMatch, error } = await supabase.from('matches').insert(newMatchData).select().single();

    if (error) {
        console.error("Error creating new match:", error);
        toast({ title: "Erreur", description: "Impossible de créer le match.", variant: "destructive"});
    } else {
        router.push(`/match/${newMatch.id}`);
    }
  };

  const deleteMatch = async (matchId: string) => {
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if(error){
        toast({ title: "Erreur", description: "Impossible de supprimer le match.", variant: "destructive"});
    } else {
        toast({ title: "Match supprimé", description: "Le match a été supprimé avec succès."});
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} role={role}/>
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      
      <main className="flex-grow p-4 md:p-8 main-bg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Tableau de Bord des Matchs</h1>
            {role === 'coach' && (
              <Button onClick={createNewMatch}>
                <PlusCircle className="mr-2" />
                Créer un match
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:gap-6">
            {matches.length > 0 ? (
              matches.sort((a, b) => new Date(b.details.date).getTime() - new Date(a.details.date).getTime()).map(match => (
                <Card key={match.id} className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle>NBFC Futsal vs {match.details.opponent}</CardTitle>
                    <CardDescription>
                      {new Date(match.details.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à {match.details.time} - {match.details.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="font-bold text-xs uppercase text-muted-foreground">Domicile</div>
                                <div className="text-3xl font-bold font-['Orbitron',_sans-serif] text-primary">{String(match.scoreboard.homeScore).padStart(2, '0')}</div>
                                <FoulDisplay count={match.scoreboard.homeFouls} />
                            </div>
                            <div className="text-2xl font-light text-muted-foreground">-</div>
                             <div className="text-center">
                                <div className="font-bold text-xs uppercase text-muted-foreground">Extérieur</div>
                                <div className="text-3xl font-bold font-['Orbitron',_sans-serif] text-primary">{String(match.scoreboard.awayScore).padStart(2, '0')}</div>
                                <FoulDisplay count={match.scoreboard.awayFouls} />
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground font-semibold border-t sm:border-t-0 sm:border-l border-border/50 pt-2 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                            Joueurs convoqués: {match.team.length + match.substitutes.length}
                        </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 bg-background/30 p-4">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/match/${match.id}`)}>
                      <Eye className="mr-2 h-4 w-4"/>
                      Consulter le match
                    </Button>
                    {role === 'coach' && (
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Supprimer
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible et supprimera définitivement les données de ce match.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMatch(match.id)}>
                              Confirmer la suppression
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center bg-card/50 border-dashed">
                <CardTitle>Aucun match trouvé</CardTitle>
                <CardDescription className="mt-2">
                  {role === 'coach'
                    ? 'Cliquez sur "Créer un match" pour commencer.'
                    : 'Les matchs apparaîtront ici dès que le coach les aura créés.'}
                </CardDescription>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
