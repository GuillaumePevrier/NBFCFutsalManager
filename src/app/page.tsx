
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Match, Role } from '@/lib/types';
import MiniScoreboard from '@/components/MiniScoreboard';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import { deleteMatch } from './actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch matches:", error);
      } else {
        setMatches(data as Match[]);
      }
      setLoading(false);
    };

    fetchMatches();

    const channel = supabase.channel('matches-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setMatches(currentMatches => [payload.new as Match, ...currentMatches].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setMatches(currentMatches => currentMatches.map(m => m.id === payload.new.id ? payload.new as Match : m));
          } else if (payload.eventType === 'DELETE') {
            setMatches(currentMatches => currentMatches.filter(m => m.id !== (payload.old as Match).id));
          }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
  
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

  const handleCreateMatch = async () => {
    const newMatch = {
      details: {
        opponent: 'Adversaire',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        location: 'Lieu à définir',
        remarks: '',
        matchType: '20min',
      },
      team: [],
      substitutes: [],
      scoreboard: {
        homeScore: 0,
        awayScore: 0,
        homeFouls: 0,
        awayFouls: 0,
        time: 20 * 60, // 20 minutes in seconds
        isRunning: false,
        period: 1,
        timerLastStarted: null,
      },
    };

    const { data, error } = await supabase.from('matches').insert(newMatch).select().single();

    if (error) {
      console.error('Error creating match:', error);
      toast({ title: "Erreur", description: "La création du match a échoué.", variant: "destructive" });
      return;
    }
    
    router.push(`/match/${data.id}`);
  };

  const handleDeleteMatch = async (matchId: string) => {
    setDeletingId(matchId);
    const result = await deleteMatch(matchId);
    setDeletingId(null);
    if (result.success) {
      toast({ title: "Match Supprimé", description: "Le match a été supprimé avec succès." });
    } else {
      toast({ title: "Erreur", description: "La suppression du match a échoué.", variant: "destructive" });
    }
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      <main className="flex-grow flex flex-col items-center p-4 md:p-8 main-bg">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Tableau de Bord des Matchs</h1>
            {role === 'coach' && (
                <Button onClick={handleCreateMatch}>
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Nouveau Match
                </Button>
            )}
          </div>
          
          {loading ? (
             <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">Chargement des matchs...</p>
                </CardContent>
              </Card>
          ) : matches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Aucun match programmé pour le moment.</p>
                {role === 'player' && <p className="text-muted-foreground mt-2">Seul le coach peut créer un nouveau match.</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match) => (
                <Card key={match.id} className="hover:border-primary transition-colors duration-200 flex flex-col relative group">
                   <CardHeader>
                        <CardTitle className="truncate text-lg pr-8">
                            Match vs <span className="text-primary">{match.details.opponent}</span>
                        </CardTitle>
                        <CardDescription>
                            {format(new Date(match.details.date), "EEEE d MMMM yyyy", { locale: fr })} à {match.details.time}
                        </CardDescription>
                   </CardHeader>
                  <CardContent className="flex flex-col justify-between flex-grow">
                     <p className="text-sm text-muted-foreground mb-4 truncate">{match.details.location}</p>
                     <MiniScoreboard scoreboard={match.scoreboard} opponentName={match.details.opponent} />
                  </CardContent>
                   <div className="p-4 pt-0 mt-auto">
                     <Button asChild variant="outline" size="sm" className="w-full">
                       <Link href={`/match/${match.id}`} className="flex items-center justify-center">
                         Accéder au match <ArrowRight className="ml-2 h-4 w-4" />
                       </Link>
                     </Button>
                   </div>
                   {role === 'coach' && (
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            {deletingId === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> :<Trash2 className="h-4 w-4" />}
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Le match contre <span className="font-bold">{match.details.opponent}</span> sera définitivement supprimé.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMatch(match.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                   )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
