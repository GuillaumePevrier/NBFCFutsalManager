
'use client';

import { useState, useEffect } from 'react';
import type { Match, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { PlusCircle, Eye, Trash2, Timer } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const FUTSAL_PERIOD_DURATION = 20 * 60; // 20 minutes in seconds

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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

const MatchCardTimer = ({ match }: { match: Match }) => {
    const [time, setTime] = useState(match.scoreboard.time);

    useEffect(() => {
        setTime(match.scoreboard.time); // Sync with updates from Supabase
        
        let timer: NodeJS.Timeout | undefined;
        if (match.scoreboard.isRunning && match.scoreboard.time > 0) {
            const lastUpdatedTime = new Date(match.created_at).getTime(); // Approximation
            const serverTime = match.scoreboard.time;
            
            // A more robust solution would store last_updated timestamp in scoreboard
            // For now, we just count down from the last known time.
            timer = setInterval(() => {
                setTime(prevTime => Math.max(0, prevTime - 1));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [match.scoreboard.time, match.scoreboard.isRunning, match.created_at]);

    if (!match.scoreboard.isRunning || time <= 0) {
        return (
            <span className="text-xs">
                Période: {match.scoreboard.period}
            </span>
        );
    }
    
    return (
        <>
            <div className="flex items-center gap-2 text-accent font-bold font-['Orbitron',_sans-serif] animate-pulse">
                <Timer className="h-4 w-4" />
                <span>{formatTime(time)}</span>
            </div>
            <span className="text-xs">
                Période: {match.scoreboard.period}
            </span>
        </>
    );
};


export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const loadMatches = async () => {
    const { data: loadedMatches, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch matches from Supabase", error);
        toast({ title: "Erreur", description: "Impossible de charger les matchs.", variant: "destructive"});
        setMatches([]);
    } else {
        setMatches(loadedMatches);
        if (loadedMatches.length === 0 && role === 'coach') {
            await createNewMatch(true); // Create a demo match if none exist for a coach
        }
    }
  };

  useEffect(() => {
    if(role) {
      loadMatches();
    }
    
    const channel = supabase
      .channel('matches_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          setMatches(currentMatches => {
            if (payload.eventType === 'INSERT') {
              return [payload.new as Match, ...currentMatches];
            }
            if (payload.eventType === 'UPDATE') {
              return currentMatches.map(m => (m.id === payload.new.id ? payload.new as Match : m))
            }
            if (payload.eventType === 'DELETE') {
              return currentMatches.filter(m => m.id !== (payload.old as Match).id)
            }
            return currentMatches;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, role]);

  useEffect(() => {
    const checkRole = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setRole(session ? 'coach' : 'player');
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

  const createNewMatch = async (isDemo = false) => {
    const newMatchData: Omit<Match, 'id' | 'created_at'> = {
      details: {
        opponent: isDemo ? 'Équipe de Démo' : 'Nouvel Adversaire',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        location: isDemo ? 'Gymnase de Démo' : 'Lieu à définir',
        remarks: isDemo ? 'Ceci est un match de démonstration.' : '',
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
        if(!isDemo) {
          router.push(`/match/${newMatch.id}`);
        } else {
          // If it's a demo, we rely on the realtime subscription to update the state
          toast({ title: "Match de démo créé", description: "Un match de démo a été ajouté."});
        }
    }
  };

  const deleteMatch = async (matchId: string) => {
    // Optimistic update first
    setMatches(currentMatches => currentMatches.filter(m => m.id !== matchId));
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if(error){
        toast({ title: "Erreur", description: "Impossible de supprimer le match.", variant: "destructive"});
        // Re-fetch if deletion failed to revert optimistic update
        loadMatches();
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
              <Button onClick={() => createNewMatch(false)}>
                <PlusCircle className="mr-2" />
                Créer un match
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:gap-6">
            {matches.length > 0 ? (
              matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(match => (
                <Card key={match.id} className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle>NBFC Futsal vs {match.details.opponent}</CardTitle>
                    <CardDescription>
                      {new Date(match.details.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à {match.details.time} - {match.details.location}
                      <span className="block text-xs mt-1">Joueurs convoqués: {match.team.length + match.substitutes.length}</span>
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
                        <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground font-semibold border-t sm:border-t-0 sm:border-l border-border/50 pt-2 sm:pt-0 sm:pl-4 mt-2 sm:mt-0 flex-shrink-0">
                           <MatchCardTimer match={match} />
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
                    ? 'Un match de démonstration va être créé...'
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
