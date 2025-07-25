
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, PlayerPosition, Role, MatchDetails as MatchDetailsType } from '@/lib/types';
import ControlPanel from '@/components/ControlPanel';
import FutsalCourt from '@/components/FutsalCourt';
import PlayerToken from '@/components/PlayerToken';
import CoachAuthDialog from '@/components/CoachAuthDialog';
import Header from '@/components/Header';
import MatchDetails from '@/components/MatchDetails';

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

export default function Home() {
  const [team, setTeam] = useState<PlayerPosition[]>([]);
  const [substitutes, setSubstitutes] = useState<PlayerPosition[]>([]);
  const [role, setRole] = useState<Role>('player');
  const [draggingPlayer, setDraggingPlayer] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const [isCoachAuthOpen, setIsCoachAuthOpen] = useState(false);
  const [matchDetails, setMatchDetails] = useState<MatchDetailsType>({
    opponent: '',
    date: '',
    time: '',
    location: '',
    remarks: '',
  });

  const getFullTeam = useCallback(() => [...team, ...substitutes], [team, substitutes]);

  useEffect(() => {
    try {
      const savedTeam = localStorage.getItem('futsal_team_composition');
      const savedSubs = localStorage.getItem('futsal_substitutes');
      const savedDetails = localStorage.getItem('futsal_match_details');
      if (savedTeam) {
        setTeam(JSON.parse(savedTeam));
      }
      if (savedSubs) {
        setSubstitutes(JSON.parse(savedSubs));
      }
      if (savedDetails) {
        setMatchDetails(JSON.parse(savedDetails));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  const saveComposition = useCallback(() => {
    localStorage.setItem('futsal_team_composition', JSON.stringify(team));
    localStorage.setItem('futsal_substitutes', JSON.stringify(substitutes));
  }, [team, substitutes]);
  
  const saveMatchDetails = useCallback((details: MatchDetailsType) => {
    setMatchDetails(details);
    localStorage.setItem('futsal_match_details', JSON.stringify(details));
  }, []);

  useEffect(() => {
    if (role === 'coach') {
      saveComposition();
    }
  }, [team, substitutes, role, saveComposition]);

  const handleAddPlayer = (playerId: string) => {
    const playerToAdd = allPlayers.find(p => p.id === playerId);
    if (!playerToAdd) return;
    
    if (team.length < MAX_ON_FIELD) {
      setTeam([...team, { ...playerToAdd, position: { x: 50, y: 85 } }]);
    } else {
      const subIndex = substitutes.length;
      setSubstitutes([...substitutes, { ...playerToAdd, position: { x: 5 + (subIndex * 10) , y: -15 } }]);
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setTeam(team.filter(p => p.id !== playerId));
    setSubstitutes(substitutes.filter(p => p.id !== playerId));
  };
  
  const handleReset = () => {
    setTeam([]);
    setSubstitutes([]);
    localStorage.removeItem('futsal_team_composition');
    localStorage.removeItem('futsal_substitutes');
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (role !== 'coach') return;
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    setDraggingPlayer({ 
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingPlayer || !courtRef.current) return;

    const courtRect = courtRef.current.getBoundingClientRect();
    const x = e.clientX - courtRect.left - draggingPlayer.offsetX;
    const y = e.clientY - courtRect.top - draggingPlayer.offsetY;

    // Convert to percentage and clamp
    const newX = Math.max(0, Math.min(100, (x / courtRect.width) * 100));
    const newY = Math.max(-20, Math.min(100, (y / courtRect.height) * 100)); // Allow y to go slightly above
    
    const isSub = substitutes.some(p => p.id === draggingPlayer.id);

    const updatePosition = (playerList: PlayerPosition[]) => playerList.map(p => 
        p.id === draggingPlayer.id ? { ...p, position: { x: newX, y: newY } } : p
    );

    if (isSub) {
      setSubstitutes(updatePosition);
    } else {
      setTeam(updatePosition);
    }
  }, [draggingPlayer, substitutes]);

  const handleMouseUp = useCallback(() => {
    if (!draggingPlayer || !courtRef.current) {
        setDraggingPlayer(null);
        return;
    }

    const draggedPlayer = [...team, ...substitutes].find(p => p.id === draggingPlayer.id);
    if (!draggedPlayer) {
        setDraggingPlayer(null);
        return;
    }

    const { y } = draggedPlayer.position;

    // Check if moving from court to bench
    if (y < 0 && team.some(p => p.id === draggedPlayer.id)) {
        setTeam(t => t.filter(p => p.id !== draggedPlayer.id));
        setSubstitutes(s => [...s, draggedPlayer]);
    }
    // Check if moving from bench to court
    else if (y >= 0 && substitutes.some(p => p.id === draggedPlayer.id)) {
        if (team.length < MAX_ON_FIELD) {
            setSubstitutes(s => s.filter(p => p.id !== draggedPlayer.id));
            setTeam(t => [...t, draggedPlayer]);
        }
    }

    setDraggingPlayer(null);
  }, [draggingPlayer, team, substitutes]);

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

  return (
    <div className="flex h-screen bg-background text-foreground flex-col">
       <Header onCoachClick={() => setIsCoachAuthOpen(true)} />
       <CoachAuthDialog isOpen={isCoachAuthOpen} onOpenChange={setIsCoachAuthOpen} onAuthenticated={onCoachLogin} />
      <main className="flex flex-col md:flex-row flex-grow font-body overflow-hidden main-bg">
        <div className="flex-grow flex flex-col items-center justify-center p-2 md:p-4 lg:p-8 relative gap-4">
          <FutsalCourt ref={courtRef}>
            {[...team, ...substitutes].map(player => (
              <PlayerToken
                key={player.id}
                player={player}
                onMouseDown={e => handleDragStart(e, player.id)}
                isDraggable={role === 'coach'}
                isDragging={draggingPlayer?.id === player.id}
                isSubstitute={substitutes.some(p => p.id === player.id)}
              />
            ))}
          </FutsalCourt>
          <MatchDetails 
            details={matchDetails}
            onDetailsChange={saveMatchDetails}
            isCoach={role === 'coach'}
          />
        </div>
        <ControlPanel
          allPlayers={allPlayers}
          team={team}
          substitutes={substitutes}
          role={role}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onReset={handleReset}
          onSave={saveComposition}
        />
      </main>
    </div>
  );
}
