
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Match } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import Header from '@/components/Header';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [role, setRole] = useState<'player' | 'coach'>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOpponent, setNewOpponent] = useState('');
  const router = useRouter();

  useEffect(() => {
    try {
      const savedMatches = localStorage.getItem('futsal_matches');
      if (savedMatches) {
        setMatches(JSON.parse(savedMatches));
      }
    } catch (error) {
      console.error("Failed to parse matches from localStorage", error);
    }
  }, []);

  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  };
  
  const createNewMatch = () => {
    if (!newOpponent.trim()) return;

    const newMatch: Match = {
      id: new Date().toISOString(),
      details: {
        opponent: newOpponent,
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: '',
        remarks: '',
      },
      team: [],
      substitutes: [],
      scoreboard: {
        homeScore: 0,
        awayScore: 0,
        homeFouls: 0,
        awayFouls: 0,
        time: 20 * 60,
        isRunning: false,
        period: 1,
      },
    };

    const updatedMatches = [...matches, newMatch];
    setMatches(updatedMatches);
    localStorage.setItem('futsal_matches', JSON.stringify(updatedMatches));
    
    setIsCreateDialogOpen(false);
    setNewOpponent('');
    router.push(`/match/${newMatch.id}`);
  };

  const deleteMatch = (matchId: string) => {
    const updatedMatches = matches.filter(m => m.id !== matchId);
    setMatches(updatedMatches);
    localStorage.setItem('futsal_matches', JSON.stringify(updatedMatches));
  };


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      
      <main className="flex-grow p-4 md:p-8 main-bg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Tableau de bord des Matchs</h1>
            {role === 'coach' && (
               <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2" /> Créer un match
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Créer un nouveau match</DialogTitle>
                    <DialogDescription>
                        Entrez le nom de l'équipe adverse pour commencer.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="opponent-name">Nom de l'adversaire</Label>
                        <Input 
                            id="opponent-name"
                            value={newOpponent}
                            onChange={(e) => setNewOpponent(e.target.value)}
                            placeholder="Ex: FC Rive Droite"
                        />
                    </div>
                    <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annuler</Button>
                    <Button onClick={createNewMatch}>Créer et configurer</Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map(match => (
              <Card key={match.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">NBFC vs {match.details.opponent}</CardTitle>
                  <CardDescription>{match.details.date} {match.details.time && `- ${match.details.time}`}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-4xl font-bold text-center">
                    <span className="text-primary">{match.scoreboard.homeScore}</span> - <span>{match.scoreboard.awayScore}</span>
                  </div>
                  <p className="text-center text-muted-foreground mt-2">{match.details.location || 'Lieu non défini'}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Link href={`/match/${match.id}`} passHref>
                        <Button variant="outline" size="sm">
                            <Edit className="mr-2 h-4 w-4" />
                            {role === 'coach' ? 'Gérer' : 'Voir'}
                        </Button>
                    </Link>
                    {role === 'coach' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action est irréversible et supprimera définitivement la fiche de ce match.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMatch(match.id)}>
                                    Supprimer
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
              </Card>
            ))}
             {matches.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 text-center py-16">
                    <p className="text-muted-foreground">Aucun match créé pour le moment.</p>
                    {role === 'coach' && <p className="text-muted-foreground mt-2">Cliquez sur "Créer un match" pour commencer.</p>}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
