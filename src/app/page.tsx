
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
} from "@/components/ui/alert-dialog"

const FUTSAL_PERIOD_DURATION = 20 * 60; // 20 minutes in seconds

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadMatches = () => {
      try {
        const savedMatchesJSON = localStorage.getItem('futsal_matches');
        if (savedMatchesJSON) {
          setMatches(JSON.parse(savedMatchesJSON));
        }
      } catch (error) {
        console.error("Failed to parse matches from localStorage", error);
        setMatches([]);
      }
    };

    if (typeof window !== 'undefined') {
      loadMatches();
       // Listen for storage changes to update the list
      window.addEventListener('storage', loadMatches);
      return () => {
        window.removeEventListener('storage', loadMatches);
      };
    }
  }, []);

  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  };

  const createNewMatch = () => {
    const newMatch: Match = {
      id: `match_${Date.now()}`,
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

    const updatedMatches = [...matches, newMatch];
    localStorage.setItem('futsal_matches', JSON.stringify(updatedMatches));
    setMatches(updatedMatches);
    router.push(`/match/${newMatch.id}`);
  };

  const deleteMatch = (matchId: string) => {
    const updatedMatches = matches.filter(m => m.id !== matchId);
    localStorage.setItem('futsal_matches', JSON.stringify(updatedMatches));
    setMatches(updatedMatches);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
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
                <Card key={match.id} className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>NBFC Futsal vs {match.details.opponent}</CardTitle>
                    <CardDescription>
                      {new Date(match.details.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} à {match.details.time} - {match.details.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Score: {match.scoreboard.homeScore} - {match.scoreboard.awayScore}</span>
                        <span>Joueurs: {match.team.length + match.substitutes.length}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/match/${match.id}`)}>
                      <Eye className="mr-2 h-4 w-4"/>
                      Consulter
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
                    : 'Connectez-vous en mode Coach pour gérer les matchs.'}
                </CardDescription>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
