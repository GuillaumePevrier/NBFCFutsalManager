
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, PlayerPosition, Role, MatchDetails as MatchDetailsType, Scoreboard as ScoreboardType, Match } from '@/lib/types';
import ControlPanel from '@/components/ControlPanel';
import FutsalCourt from '@/components/FutsalCourt';
import PlayerToken from '@/components/PlayerToken';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import Header from '@/components/Header';
import MatchDetails from '@/components/MatchDetails';
import Scoreboard from '@/components/Scoreboard';
import { useRouter, useParams } from 'next/navigation';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

const MAX_ON_FIELD = 5;

export default function MatchPage() {
  const params = useParams();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [match, setMatch] = useState<Match | null>(null);
  const [role, setRole] = useState<Role>('player');
  const [draggingPlayer, setDraggingPlayer] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const matchId = params.matchId as string;

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase.from('players').select('*').order('name');
      if (error) {
        console.error("Failed to fetch players", error);
        toast({ title: "Erreur", description: "Impossible de charger la liste des joueurs.", variant: "destructive" });
      } else {
        setAllPlayers(data as Player[]);
      }
    };
    fetchPlayers();
  }, [supabase, toast]);

  const updateMatchData = useCallback(async (updatedMatch: Match, showToast = false) => {
    // Optimistically update local state first
    setMatch(updatedMatch);

    const { error } = await supabase
      .from('matches')
      .update({
        details: updatedMatch.details,
        team: updatedMatch.team,
        substitutes: updatedMatch.substitutes,
        scoreboard: updatedMatch.scoreboard,
      })
      .eq('id', matchId);

    if (error) {
      console.error("Failed to save match data to Supabase", error);
      toast({ title: "Erreur de sauvegarde", description: "Impossible d'enregistrer les données du match.", variant: "destructive" });
    } else if (showToast) {
      toast({
        title: "Match sauvegardé !",
        description: "Les informations du match ont été enregistrées.",
      });
    }
  }, [matchId, supabase, toast]);

  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (error || !data) {
        console.error("Failed to fetch match from Supabase", error);
        toast({ title: "Match non trouvé", description: "Redirection vers la page d'accueil.", variant: "destructive" });
        router.push('/');
      } else {
        setMatch(data as Match);
      }
    };

    if (matchId) {
      fetchMatch();

      const channel = supabase.channel(`match-${matchId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, (payload) => {
          setMatch(payload.new as Match);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [matchId, router, supabase, toast]);
  
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

  const handleAddPlayer = (playerId: string) => {
    if (!match) return;
    const playerToAdd = allPlayers.find(p => p.id === playerId);
    if (!playerToAdd) return;
    
    let newTeam = [...match.team];
    let newSubstitutes = [...match.substitutes];
    
    const playerWithPosition: PlayerPosition = {
        ...playerToAdd,
        // Add fallback for avatar initials
        avatar: playerToAdd.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase(),
        position: { x: 50, y: 85 }
    };

    if (newTeam.length < MAX_ON_FIELD) {
      newTeam.push(playerWithPosition);
    } else {
      const subIndex = newSubstitutes.length;
      newSubstitutes.push({ ...playerWithPosition, position: { x: 5 + (subIndex * 10) , y: -15 } });
    }
    updateMatchData({ ...match, team: newTeam, substitutes: newSubstitutes });
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!match) return;
    const newTeam = match.team.filter(p => p.id !== playerId);
    const newSubstitutes = match.substitutes.filter(p => p.id !== playerId);
    updateMatchData({ ...match, team: newTeam, substitutes: newSubstitutes });
  };
  
  const handleReset = () => {
    if (!match) return;
    updateMatchData({ ...match, team: [], substitutes: [] });
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (role !== 'coach' || !match) return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    setDraggingPlayer({ 
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingPlayer || !courtRef.current || !match) return;

    const courtRect = courtRef.current.getBoundingClientRect();
    const x = e.clientX - courtRect.left - draggingPlayer.offsetX;
    const y = e.clientY - courtRect.top - draggingPlayer.offsetY;

    // Convert pixels to percentage, clamping between -20% and 100% for Y
    const newX = Math.max(0, Math.min(100, (x / courtRect.width) * 100));
    const newY = Math.max(-20, Math.min(100, (y / courtRect.height) * 100));
    
    // Check if the player being dragged is a substitute
    const isSub = match.substitutes.some(p => p.id === draggingPlayer.id);

    // Create a function to update player positions
    const updatePosition = (playerList: PlayerPosition[]) => playerList.map(p => 
        p.id === draggingPlayer.id ? { ...p, position: { x: newX, y: newY } } : p
    );
    
    // Update the state locally for smooth dragging
    setMatch(currentMatch => {
        if (!currentMatch) return null;
        return {
            ...currentMatch,
            team: isSub ? currentMatch.team : updatePosition(currentMatch.team),
            substitutes: isSub ? updatePosition(currentMatch.substitutes) : currentMatch.substitutes
        };
    });
  }, [draggingPlayer, match]);

  const handleMouseUp = useCallback(() => {
    if (!draggingPlayer || !courtRef.current || !match) {
        setDraggingPlayer(null);
        return;
    }

    const draggedPlayer = [...match.team, ...match.substitutes].find(p => p.id === draggingPlayer.id);
    if (!draggedPlayer) {
        setDraggingPlayer(null);
        return;
    }

    const { y } = draggedPlayer.position;
    let newTeam = [...match.team];
    let newSubstitutes = [...match.substitutes];
    let changed = false;

    // Player moved from field to bench
    if (y < 0 && match.team.some(p => p.id === draggedPlayer.id)) {
        newTeam = newTeam.filter(p => p.id !== draggedPlayer.id);
        newSubstitutes.push({ ...draggedPlayer, position: { x: 5 + (newSubstitutes.length * 10), y: -15 } });
        changed = true;
    }
    // Player moved from bench to field
    else if (y >= 0 && match.substitutes.some(p => p.id === draggedPlayer.id)) {
        if (match.team.length < MAX_ON_FIELD) {
            newSubstitutes = newSubstitutes.filter(p => p.id !== draggedPlayer.id);
            newTeam.push({ ...draggedPlayer, position: { x: draggedPlayer.position.x, y: Math.max(0, draggedPlayer.position.y) } });
            changed = true;
        }
    }
    
    // Finalize the update to Supabase
    if (changed) {
        updateMatchData({ ...match, team: newTeam, substitutes: newSubstitutes });
    } else if (match) {
        // Just save the final position if no team change occurred
        updateMatchData(match); 
    }

    setDraggingPlayer(null);
  }, [draggingPlayer, match, updateMatchData]);

  useEffect(() => {
    if (draggingPlayer) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingPlayer, handleMouseMove, handleMouseUp]);
  
  const onCoachLogin = () => {
    setRole('coach');
    setIsCoachAuthOpen(false);
  }

  const handleDetailsChange = (details: MatchDetailsType) => {
    if (!match) return;
    const periodDuration = (details.matchType === '25min' ? 25 : 20) * 60;
    
    const updatedScoreboard = { ...match.scoreboard };
    if (match.details.matchType !== details.matchType) {
        updatedScoreboard.time = periodDuration;
        updatedScoreboard.isRunning = false;
        updatedScoreboard.timerLastStarted = null;
        toast({ title: "Type de match modifié", description: `Le chronomètre a été réinitialisé à ${periodDuration/60} minutes.`})
    }
    
    updateMatchData({ ...match, details, scoreboard: updatedScoreboard }, true);
  };
  
  const handleScoreboardChange = (scoreboard: ScoreboardType) => {
    if (!match) return;
    updateMatchData({ ...match, scoreboard });
  };


  if (!match || allPlayers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>Chargement du match et des joueurs...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <Header onCoachClick={() => setIsCoachAuthOpen(true)} role={role}>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <Home className="mr-2 h-4 w-4"/>
                Retour aux matchs
            </Button>
       </Header>
       <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      <main className="flex flex-col md:flex-row flex-grow font-body main-bg overflow-y-auto">
        <div className="flex-grow flex flex-col items-center justify-start p-2 md:p-4 lg:p-8 relative gap-4">
          <Scoreboard 
            scoreboard={match.scoreboard}
            onScoreboardChange={handleScoreboardChange}
            details={match.details}
            isCoach={role === 'coach'}
          />
          <FutsalCourt ref={courtRef}>
            {[...match.team, ...match.substitutes].map(player => (
              <PlayerToken
                key={player.id}
                player={player}
                onMouseDown={e => handleDragStart(e, player.id)}
                isDraggable={role === 'coach'}
                isDragging={draggingPlayer?.id === player.id}
                isSubstitute={match.substitutes.some(p => p.id === player.id)}
              />
            ))}
          </FutsalCourt>
          <MatchDetails 
            details={match.details}
            onDetailsChange={handleDetailsChange}
            isCoach={role === 'coach'}
          />
        </div>
        <ControlPanel
          allPlayers={allPlayers}
          team={match.team}
          substitutes={match.substitutes}
          role={role}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onReset={handleReset}
          onSave={() => match && updateMatchData(match, true)}
        />
      </main>
    </div>
  );
}
