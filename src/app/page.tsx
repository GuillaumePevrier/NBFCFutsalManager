'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Player, PlayerPosition, Role } from '@/lib/types';
import ControlPanel from '@/components/ControlPanel';
import FutsalCourt from '@/components/FutsalCourt';
import PlayerToken from '@/components/PlayerToken';

const allPlayers: Player[] = [
  { id: '1', name: 'Ricardinho', avatar: 'R' },
  { id: '2', name: 'Falcao', avatar: 'F' },
  { id: '3', name: 'Amandinha', avatar: 'A' },
  { id: '4', name: 'Ferrão', avatar: 'FE' },
  { id: '5', name: 'Bateria', avatar: 'B' },
  { id: '6', name: 'Pito', avatar: 'P' },
  { id: '7', name: 'Dyego Zuffo', avatar: 'D' },
  { id: '8', name: 'Gadeia', avatar: 'G' },
  { id: '9', name: 'Leandro Lino', avatar: 'LL' },
  { id: '10', name: 'Vinícius Rocha', avatar: 'VR' },
];


export default function Home() {
  const [team, setTeam] = useState<PlayerPosition[]>([]);
  const [role, setRole] = useState<Role>('coach');
  const [draggingPlayer, setDraggingPlayer] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedTeam = localStorage.getItem('futsal_team_composition');
      if (savedTeam) {
        setTeam(JSON.parse(savedTeam));
      }
    } catch (error) {
      console.error("Failed to parse team composition from localStorage", error);
    }
  }, []);

  const saveComposition = useCallback(() => {
    localStorage.setItem('futsal_team_composition', JSON.stringify(team));
  }, [team]);

  useEffect(() => {
    if (role === 'coach') {
      saveComposition();
    }
  }, [team, role, saveComposition]);

  const handleAddPlayer = (playerId: string) => {
    if (team.length < 5 && !team.find(p => p.id === playerId)) {
      const playerToAdd = allPlayers.find(p => p.id === playerId);
      if (playerToAdd) {
        setTeam([...team, { ...playerToAdd, position: { x: 50, y: 85 } }]);
      }
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    setTeam(team.filter(p => p.id !== playerId));
  };
  
  const handleReset = () => {
    setTeam([]);
    localStorage.removeItem('futsal_team_composition');
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
    const newY = Math.max(0, Math.min(100, (y / courtRect.height) * 100));
    
    setTeam(prevTeam =>
      prevTeam.map(p =>
        p.id === draggingPlayer.id ? { ...p, position: { x: newX, y: newY } } : p
      )
    );
  }, [draggingPlayer]);

  const handleMouseUp = useCallback(() => {
    setDraggingPlayer(null);
  }, []);

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

  return (
    <main className="flex flex-col md:flex-row h-screen bg-background text-foreground font-body overflow-hidden">
      <div className="flex-grow flex items-center justify-center p-2 md:p-4 lg:p-8 relative">
        <FutsalCourt ref={courtRef}>
          {team.map(player => (
            <PlayerToken
              key={player.id}
              player={player}
              onMouseDown={e => handleDragStart(e, player.id)}
              isDraggable={role === 'coach'}
              isDragging={draggingPlayer?.id === player.id}
            />
          ))}
        </FutsalCourt>
      </div>
      <ControlPanel
        allPlayers={allPlayers}
        team={team}
        role={role}
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onReset={handleReset}
        onSetRole={setRole}
        onSave={saveComposition}
      />
    </main>
  );
}
