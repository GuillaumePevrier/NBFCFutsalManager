'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, ArrowRight, Trash2, Loader2, Trophy, ArrowLeft, ChevronLeft, ChevronRight, BarChart3, Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Match, Role } from '@/lib/types';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import { deleteMatch } from '../actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const competitions = [
    { id: 'd2', name: 'D2' },
    { id: 'd1', name: 'D1' },
    { id: 'coupe_bretagne', name: 'Coupe de Bretagne' },
    { id: 'coupe_district', name: 'Coupe du District' },
    { id: 'coupe_france', name: 'Coupe de France' },
];

export default function MatchesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const { toast } = useToast();

  const [activeCompetition, setActiveCompetition] = useState(competitions[0].id);
  const [activeFilter, setActiveFilter] = useState('results');
  const [currentMatchday, setCurrentMatchday] = useState(1);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select('*, opponent:opponents(logo_url)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch matches:", error);
        toast({ title: "Erreur", description: "Impossible de charger les matchs.", variant: "destructive" });
      } else {
        setMatches(data as any[] as Match[]);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [supabase, toast]);

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
        competition: activeCompetition,
        matchday: currentMatchday
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
        timerLastStarted: null,
      },
    };

    const { data, error } = await supabase.from('matches').insert(newMatch).select().single();

    if (error) {
      toast({ title: "Erreur", description: "La création du match a échoué.", variant: "destructive" });
      return;
    }
    
    // Add new match to local state to avoid refetch
    setMatches(prev => [data as Match, ...prev]);

    router.push(`/match/${data.id}`);
  };

  const handleDeleteMatch = async (matchId: string) => {
    setDeletingId(matchId);
    const result = await deleteMatch(matchId);
    setDeletingId(null);
    if (result.success) {
      setMatches(prev => prev.filter(m => m.id !== matchId));
      toast({ title: "Match Supprimé", description: "Le match a été supprimé." });
    } else {
      toast({ title: "Erreur", description: "La suppression du match a échoué.", variant: "destructive" });
    }
  };

  const filteredMatches = matches
    .filter(m => m.details.competition === activeCompetition && m.details.matchday === currentMatchday)
    .sort((a,b) => new Date(a.details.date).getTime() - new Date(b.details.date).getTime());

  const matchdays = Array.from(new Set(matches.filter(m => m.details.competition === activeCompetition).map(m => m.details.matchday || 1))).sort((a,b) => a-b);
  const maxMatchday = matchdays.length > 0 ? Math.max(...matchdays) : 1;

  const getOpponentLogo = (match: Match) => {
    const opponent = (match as any).opponent;
    return opponent?.logo_url;
  };

  const renderMatchRow = (match: Match) => (
    <Card key={match.id} className="group relative bg-card/80 hover:bg-card/100 transition-colors duration-200">
        <CardContent className="p-3 flex items-center justify-between">
            <div className="flex-1 text-right font-bold truncate pr-3">{match.details.opponent}</div>
            <Avatar className="w-8 h-8">
                <AvatarImage src={getOpponentLogo(match)} />
                <AvatarFallback>{match.details.opponent.substring(0,1)}</AvatarFallback>
            </Avatar>
            <div className="w-20 text-center font-['Orbitron',_sans-serif] text-lg">
                {format(new Date(match.details.date), "HH:mm")}
            </div>
             <Avatar className="w-8 h-8">
                <AvatarImage src="https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png" />
                <AvatarFallback>N</AvatarFallback>
            </Avatar>
            <div className="flex-1 font-bold truncate pl-3">NBFC Futsal</div>
        </CardContent>
        <Button asChild variant="ghost" size="sm" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
             <Link href={`/match/${match.id}`}>
                 Gérer le match
                 <ArrowRight className="ml-2 h-4 w-4" />
             </Link>
        </Button>
    </Card>
  )

  const renderContent = () => {
    if (loading) {
        return <p className="text-center text-muted-foreground p-8">Chargement des matchs...</p>;
    }

    if (activeFilter === 'results') {
        return (
            <div className="space-y-4">
                 <Card className="p-2 bg-card/50">
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentMatchday(p => Math.max(1, p - 1))} disabled={currentMatchday === 1}>
                            <ChevronLeft />
                        </Button>
                        <Select value={String(currentMatchday)} onValueChange={(val) => setCurrentMatchday(Number(val))}>
                            <SelectTrigger className="flex-grow">
                                <SelectValue placeholder="Choisir une journée" />
                            </SelectTrigger>
                            <SelectContent>
                                {matchdays.length > 0 ? matchdays.map(day => (
                                    <SelectItem key={day} value={String(day)}>Journée {day}</SelectItem>
                                )) : <SelectItem value="1">Journée 1</SelectItem>}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => setCurrentMatchday(p => Math.min(maxMatchday, p + 1))} disabled={currentMatchday === maxMatchday}>
                            <ChevronRight />
                        </Button>
                    </div>
                </Card>
                {filteredMatches.length > 0 ? (
                    <div className="space-y-2">
                        {filteredMatches.map(renderMatchRow)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground p-8">Aucun match pour cette journée.</p>
                )}
            </div>
        )
    }
     if (activeFilter === 'ranking') {
        return <div className="text-center text-muted-foreground p-8">Le classement sera bientôt disponible ici.</div>;
    }
    if (activeFilter === 'scorers') {
        return <div className="text-center text-muted-foreground p-8">Les meilleurs buteurs seront bientôt affichés ici.</div>;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
      <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      <main className="flex-grow flex flex-col p-0 md:p-4 main-bg">
        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-2xl md:text-3xl font-bold">Matchs</h1>
            {role === 'coach' && (
                <Button onClick={handleCreateMatch} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouveau Match
                </Button>
            )}
          </div>
          
          <Tabs value={activeCompetition} onValueChange={setActiveCompetition} className="w-full px-4">
            <TabsList className="relative bg-transparent p-0 border-b border-border">
              {competitions.map(comp => (
                <TabsTrigger key={comp.id} value={comp.id} className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none relative px-3 text-muted-foreground">
                    {comp.name}
                    {activeCompetition === comp.id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_hsl(var(--primary))]"></div>}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

           <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full p-4">
            <TabsList className="grid w-full grid-cols-3 bg-card/80">
                <TabsTrigger value="results"><Trophy className="mr-2 h-4 w-4"/>Résultats</TabsTrigger>
                <TabsTrigger value="ranking"><BarChart3 className="mr-2 h-4 w-4"/>Classement</TabsTrigger>
                <TabsTrigger value="scorers"><Shield className="mr-2 h-4 w-4"/>Buteurs</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="px-4 pb-4 flex-grow">
            {renderContent()}
          </div>

        </div>
      </main>
    </div>
  );
}
