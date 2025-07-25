
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
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const allPlayers: Player[] = [
    { id: '1', name: 'Leo Briantais', avatar: 'LB' },
    { id: '2', name: 'Kevin Levesque', avatar: 'KL' },
    { id: '3', name: 'Alexis Genet', avatar: 'AG' },
    { id: '4', name: 'Nicolas Georgeault', avatar: 'NG' },
    { id: '5', name: 'Omar Jaddour', avatar: 'OJ' },
    { id: '6', name: 'Francois Beaudouin', avatar: 'FB' },
    { id: '7', name: 'Benjamin Bedel', avatar: 'BB' },
    { id: '8', name: 'Nicolas Gousset', avatar: 'NG' },
    { id: '9', name: 'Alexandre Seveno', avatar: 'AS' },
    { id: '10', name: 'Erwan Anfray', avatar: 'EA' },
    { id: '11', name: 'Florian Arnoult', avatar: 'FA' },
    { id: '12', name: 'Nicolas Beillard', avatar: 'NB' },
    { id: '13', name: 'Vincent Bourdoiseau', avatar: 'VB' },
    { id: '14', name: 'Julien Durand', avatar: 'JD' },
    { id: '15', name: 'Kevin Mahe', avatar: 'KM' },
    { id: '16', name: 'Germain Maquine', avatar: 'GM' },
    { id: '17', name: 'Anousack Ouanesavady', avatar: 'AO' },
    { id: '18', name: 'Vincent Poilvet', avatar: 'VP' },
    { id: '19', name: 'Yoann Poulain', avatar: 'YP' },
    { id: '20', name: 'Amine Rhidane', avatar: 'AR' },
    { id: '21', name: 'Antoine Le Cam', avatar: 'AL' },
    { id: '22', name: 'Guillaume Pevrier', avatar: 'GP' }
];

const MAX_ON_FIELD = 5;
const FUTSAL_PERIOD_DURATION = 20 * 60; // 20 minutes in seconds

export default function MatchPage({ params }: { params: { matchId: string } }) {
  const [match, setMatch] = useState<Match | null>(null);
  const [role, setRole] = useState<Role>('player');
  const [draggingPlayer, setDraggingPlayer] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const router = useRouter();

  const matchId = params.matchId;

  const updateMatchData = useCallback((updatedMatch: Match) => {
    setMatch(updatedMatch);

    try {
      const savedMatchesJSON = localStorage.getItem('futsal_matches');
      let savedMatches: Match[] = savedMatchesJSON ? JSON.parse(savedMatchesJSON) : [];
      
      const matchIndex = savedMatches.findIndex(m => m.id === matchId);
      if (matchIndex !== -1) {
        savedMatches[matchIndex] = updatedMatch;
      } else {
        savedMatches.push(updatedMatch);
      }
      
      localStorage.setItem('futsal_matches', JSON.stringify(savedMatches));
    } catch (error) {
      console.error("Failed to save match data to localStorage", error);
    }
  }, [matchId]);

  useEffect(() => {
    try {
        const savedMatchesJSON = localStorage.getItem('futsal_matches');
        if (savedMatchesJSON) {
            const savedMatches: Match[] = JSON.parse(savedMatchesJSON);
            const currentMatch = savedMatches.find(m => m.id === matchId);
            if (currentMatch) {
                setMatch(currentMatch);
            } else {
                console.warn(`Match with ID ${matchId} not found. Redirecting.`);
                router.push('/');
            }
        } else {
            console.warn("No matches found in localStorage. Redirecting.");
            router.push('/');
        }
    } catch (error) {
        console.error("Failed to parse matches from localStorage", error);
        router.push('/');
    }
  }, [matchId, router]);


  const handleAddPlayer = (playerId: string) => {
    if (!match) return;
    const playerToAdd = allPlayers.find(p => p.id === playerId);
    if (!playerToAdd) return;
    
    let newTeam = [...match.team];
    let newSubstitutes = [...match.substitutes];

    if (newTeam.length < MAX_ON_FIELD) {
      newTeam.push({ ...playerToAdd, position: { x: 50, y: 85 } });
    } else {
      const subIndex = newSubstitutes.length;
      newSubstitutes.push({ ...playerToAdd, position: { x: 5 + (subIndex * 10) , y: -15 } });
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

    const newX = Math.max(0, Math.min(100, (x / courtRect.width) * 100));
    const newY = Math.max(-20, Math.min(100, (y / courtRect.height) * 100));
    
    const isSub = match.substitutes.some(p => p.id === draggingPlayer.id);

    const updatePosition = (playerList: PlayerPosition[]) => playerList.map(p => 
        p.id === draggingPlayer.id ? { ...p, position: { ...p.position, x: newX, y: newY } } : p
    );
    
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

    if (y < 0 && match.team.some(p => p.id === draggedPlayer.id)) {
        newTeam = newTeam.filter(p => p.id !== draggedPlayer.id);
        newSubstitutes.push({ ...draggedPlayer, position: { x: 5 + (newSubstitutes.length * 10), y: -15 } });
        changed = true;
    }
    else if (y >= 0 && match.substitutes.some(p => p.id === draggedPlayer.id)) {
        if (match.team.length < MAX_ON_FIELD) {
            newSubstitutes = newSubstitutes.filter(p => p.id !== draggedPlayer.id);
            newTeam.push({ ...draggedPlayer, position: { x: draggedPlayer.position.x, y: Math.max(0, draggedPlayer.position.y) } });
            changed = true;
        }
    }
    
    if (changed) {
        updateMatchData({ ...match, team: newTeam, substitutes: newSubstitutes });
    } else if (match) {
        updateMatchData(match); // Save final position
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
    updateMatchData({ ...match, details });
  };
  
  const handleScoreboardChange = (scoreboard: ScoreboardType) => {
    if (!match) return;
    updateMatchData({ ...match, scoreboard });
  };


  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <p>Chargement du match...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <Header onCoachClick={() => setIsCoachAuthOpen(true)}>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <Home className="mr-2 h-4 w-4"/>
                Retour
            </Button>
       </Header>
       <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      <main className="flex flex-col md:flex-row flex-grow font-body main-bg overflow-y-auto">
        <div className="flex-grow flex flex-col items-center justify-center p-2 md:p-4 lg:p-8 relative gap-4">
          <Scoreboard 
            scoreboard={match.scoreboard}
            onScoreboardChange={handleScoreboardChange}
            opponentName={match.details.opponent}
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
          onSave={() => match && updateMatchData(match)}
        />
      </main>
    </div>
  );
}

