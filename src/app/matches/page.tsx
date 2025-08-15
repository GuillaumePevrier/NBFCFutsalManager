
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, ArrowRight, Loader2, Trophy, ArrowLeft, ChevronLeft, ChevronRight, BarChart3, Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import type { Match, Role, Opponent } from '@/lib/types';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MiniScoreboard from '@/components/MiniScoreboard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const competitions = [
    { id: 'd2', name: 'D2' },
    { id: 'd1', name: 'D1' },
    { id: 'coupe_bretagne', name: 'Coupe de Bretagne' },
    { id: 'coupe_district', name: 'Coupe du District' },
    { id: 'coupe_france', name: 'Coupe de France' },
    { id: 'amical', name: 'Amical' },
];

export default function MatchesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [matches, setMatches] = useState<Match[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('player');
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const { toast } = useToast();

  const [activeCompetition, setActiveCompetition] = useState(competitions[0].id);
  const [activeFilter, setActiveFilter] = useState('results');
  const [currentMatchday, setCurrentMatchday] = useState(1);

  useEffect(() => {
    const fetchMatchesAndOpponents = async () => {
      setLoading(true);
      
      const { data: opponentsData, error: opponentsError } = await supabase
        .from('opponents')
        .select('id, logo_url');

      if (opponentsError) {
        console.error("Failed to fetch opponents:", opponentsError);
        toast({ title: "Erreur", description: "Impossible de charger les données des adversaires.", variant: "destructive" });
      } else {
        setOpponents(opponentsData || []);
      }
      
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && Object.keys(error).length > 0 && error.message) {
        console.error("Failed to fetch matches:", error);
        toast({ title: "Erreur", description: "Impossible de charger les matchs.", variant: "destructive" });
      } else {
        setMatches((data as Match[] || []).map(m => ({
          ...m,
          details: {
            ...m.details,
            venue: m.details?.venue || 'home',
            competition: m.details?.competition || 'amical',
            matchday: m.details?.matchday || 1
          }
        })));
      }
      setLoading(false);
    };

    fetchMatchesAndOpponents();
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
        venue: 'home',
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
    
    setMatches(prev => [data as Match, ...prev]);

    router.push(`/match/${data.id}`);
  };

  const filteredMatches = matches
    .filter(m => (m.details?.competition || 'amical') === activeCompetition)
    .filter(m => activeCompetition === 'amical' || (m.details?.matchday || 1) === currentMatchday)
    .sort((a,b) => new Date(a.details.date).getTime() - new Date(b.details.date).getTime());


  const matchdays = Array.from(new Set(matches.filter(m => m.details?.competition === activeCompetition).map(m => m.details.matchday || 1))).sort((a,b) => a-b);
  const maxMatchday = matchdays.length > 0 ? Math.max(...matchdays) : 1;

  const getOpponentLogo = (match: Match) => {
    const opponent = opponents.find(o => o.id === match.details?.opponentId);
    return opponent?.logo_url;
  };

  const handleCompetitionChange = (direction: 'next' | 'prev') => {
    const currentIndex = competitions.findIndex(c => c.id === activeCompetition);
    if (direction === 'next') {
        const nextIndex = (currentIndex + 1) % competitions.length;
        setActiveCompetition(competitions[nextIndex].id);
    } else {
        const prevIndex = (currentIndex - 1 + competitions.length) % competitions.length;
        setActiveCompetition(competitions[prevIndex].id);
    }
  };
  
  const TeamDisplay = ({ name, logoUrl, fallback, align = 'left' }: { name: string, logoUrl?: string, fallback: string, align?: 'left' | 'right' }) => (
     <div className={cn(
        "flex items-center gap-2 flex-1 shrink",
        align === 'left' ? 'justify-start' : 'justify-end'
        )}>
         {align === 'right' && <div className="font-bold truncate hidden sm:block">{name}</div>}
        <Avatar className="w-8 h-8">
            <AvatarImage src={logoUrl} />
            <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        {align === 'left' && <div className="font-bold truncate hidden sm:block">{name}</div>}
    </div>
  )

  const renderMatchRow = (match: Match) => {
    const isHome = match.details.venue === 'home';
    const nbfcName = "NBFC Futsal";
    const opponentName = match.details.opponent;
    const opponentLogo = getOpponentLogo(match);

    const homeTeam = isHome ? { name: nbfcName, logo: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png", fallback: "N" } : { name: opponentName, logo: opponentLogo, fallback: opponentName ? opponentName.substring(0,1) : 'A' };
    const awayTeam = isHome ? { name: opponentName, logo: opponentLogo, fallback: opponentName ? opponentName.substring(0,1) : 'A' } : { name: nbfcName, logo: "https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png", fallback: "N" };

    return (
        <Card key={match.id} className="group relative bg-card/80 hover:bg-card/100 transition-colors duration-200 overflow-hidden">
            <CardContent className="p-3 flex items-center justify-between gap-2">
                 <TeamDisplay name={homeTeam.name} logoUrl={homeTeam.logo} fallback={homeTeam.fallback} align="left" />
                <div className="w-36 sm:w-40 md:w-48 shrink-0">
                    <MiniScoreboard scoreboard={match.scoreboard} opponentName={match.details.opponent} homeName={nbfcName} venue={match.details.venue} />
                </div>
                <TeamDisplay name={awayTeam.name} logoUrl={awayTeam.logo} fallback={awayTeam.fallback} align="right" />
            </CardContent>
            <Button asChild variant="ghost" size="sm" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
                 <Link href={`/match/${match.id}`}>
                     Gérer le match
                     <ArrowRight className="ml-2 h-4 w-4" />
                 </Link>
            </Button>
        </Card>
    )
  }

  const renderContent = () => {
    if (loading) {
        return <p className="text-center text-muted-foreground p-8">Chargement des matchs...</p>;
    }

    if (activeFilter === 'results') {
        return (
            <div className="space-y-4">
                 {activeCompetition !== 'amical' && (
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
                 )}
                {filteredMatches.length > 0 ? (
                    <div className="space-y-2">
                        {filteredMatches.map(renderMatchRow)}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground p-8">Aucun match pour cette sélection.</p>
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
          
           <div className="px-4 mb-4">
             <Card className="p-2 bg-card/50">
                <div className="flex items-center justify-between gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleCompetitionChange('prev')}>
                        <ChevronLeft />
                    </Button>
                    <Select value={activeCompetition} onValueChange={setActiveCompetition}>
                        <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="Choisir une compétition" />
                        </SelectTrigger>
                        <SelectContent>
                            {competitions.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => handleCompetitionChange('next')}>
                        <ChevronRight />
                    </Button>
                </div>
            </Card>
           </div>


           <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full px-4">
            <TabsList className="grid w-full grid-cols-3 bg-card/80">
                <TabsTrigger value="results"><Trophy className="mr-2 h-4 w-4"/>Résultats</TabsTrigger>
                <TabsTrigger value="ranking"><BarChart3 className="mr-2 h-4 w-4"/>Classement</TabsTrigger>
                <TabsTrigger value="scorers"><Shield className="mr-2 h-4 w-4"/>Buteurs</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="px-4 py-4 flex-grow">
            {renderContent()}
          </div>

        </div>
      </main>
    </div>
  );
}

