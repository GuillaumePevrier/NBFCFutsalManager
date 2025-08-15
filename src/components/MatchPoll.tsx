
'use client';

import type { MatchPoll, Player, Role, PlayerAvailability } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Play, Power, PowerOff, RefreshCw, ThumbsDown, ThumbsUp, UserCheck, UserX, HelpCircle, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
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
import { Input } from './ui/input';
import { Label } from './ui/label';

interface MatchPollProps {
  poll: MatchPoll;
  allPlayers: Player[];
  onPollChange: (poll: MatchPoll) => void;
  role: Role;
}

const Countdown = ({ deadline }: { deadline: string | null }) => {
  const calculateTimeLeft = () => {
    if (!deadline) return null;
    const difference = +new Date(deadline) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
        heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        secondes: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  if (!timeLeft || Object.keys(timeLeft).length === 0) {
    return <span className="text-destructive font-semibold">Sondage terminé</span>;
  }

  const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
    if (value === 0 && (interval === 'jours' || (interval === 'heures' && timeLeft.jours === 0))) return null;
    return (
      <span key={interval} className="text-lg font-mono">
        {String(value).padStart(2, '0')}{interval.charAt(0)}
      </span>
    );
  });

  return <div className="flex items-baseline gap-1.5">{timerComponents}</div>;
};

export default function MatchPollComponent({ poll, allPlayers, onPollChange, role }: MatchPollProps) {
  const [deadlineHours, setDeadlineHours] = useState(24);

  const handleStartPoll = () => {
    if (deadlineHours <= 0) return;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + deadlineHours);

    const initialAvailabilities = allPlayers.map(p => ({
      playerId: p.id,
      status: 'undecided' as const
    }));

    onPollChange({
      status: 'active',
      deadline: deadline.toISOString(),
      availabilities: initialAvailabilities,
    });
  };
  
  const handleStopPoll = () => {
    onPollChange({ ...poll, status: 'closed' });
  };
  
  const handleResetPoll = () => {
    onPollChange({
      status: 'inactive',
      deadline: null,
      availabilities: [],
    });
  };

  const handlePlayerResponse = (playerId: string, status: 'available' | 'unavailable') => {
    const newAvailabilities = poll.availabilities.map(a => 
      a.playerId === playerId ? { ...a, status } : a
    );
    onPollChange({ ...poll, availabilities: newAvailabilities });
  };
  
  const getPlayerById = (id: string) => allPlayers.find(p => p.id === id);
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const availabilityCounts = poll.availabilities.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, { available: 0, unavailable: 0, undecided: 0 });

  const renderPlayerList = (players: PlayerAvailability[]) => {
     if (players.length === 0) {
        return <p className="text-sm text-muted-foreground text-center col-span-full py-4">Aucun joueur dans cette catégorie.</p>
     }
    return players.map(({ playerId, status }) => {
      const player = getPlayerById(playerId);
      if (!player) return null;
      return (
        <div key={playerId} className="flex items-center justify-between p-2 rounded-md bg-muted">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={player.avatar_url} alt={player.name} />
              <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{player.name}</span>
          </div>
          {role === 'coach' && (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-500 hover:bg-green-500/10" onClick={() => handlePlayerResponse(playerId, 'available')}>
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => handlePlayerResponse(playerId, 'unavailable')}>
                <ThumbsDown className="h-4 w-4"/>
              </Button>
            </div>
          )}
        </div>
      );
    });
  }

  const availablePlayers = poll.availabilities.filter(p => p.status === 'available');
  const unavailablePlayers = poll.availabilities.filter(p => p.status === 'unavailable');
  const undecidedPlayers = poll.availabilities.filter(p => p.status === 'undecided');

  return (
    <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users />
            Sondage de Disponibilité
            </CardTitle>
            {poll.status === 'active' && <Countdown deadline={poll.deadline} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {poll.status === 'inactive' && role === 'coach' && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-muted rounded-lg">
             <div className='flex items-center gap-2'>
                <Label htmlFor="deadline-hours">Durée (heures):</Label>
                <Input 
                    id="deadline-hours"
                    type="number"
                    value={deadlineHours}
                    onChange={(e) => setDeadlineHours(parseInt(e.target.value))}
                    className="w-20"
                />
            </div>
            <Button onClick={handleStartPoll}><Play className="mr-2 h-4 w-4"/>Démarrer le sondage</Button>
          </div>
        )}

        {poll.status === 'active' && role === 'coach' && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive"><PowerOff className="mr-2 h-4 w-4"/>Arrêter</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Arrêter le sondage ?</AlertDialogTitle><AlertDialogDescription>Cela fermera le sondage et empêchera les joueurs de répondre.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleStopPoll}>Arrêter</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Réinitialiser</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Réinitialiser le sondage ?</AlertDialogTitle><AlertDialogDescription>Toutes les réponses seront effacées. Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleResetPoll}>Réinitialiser</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        
         {poll.status === 'closed' && role === 'coach' && (
          <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold">Sondage terminé.</p>
            <Button onClick={handleResetPoll} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Réinitialiser</Button>
          </div>
        )}

        {poll.status !== 'inactive' && (
            <div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className='space-y-2'>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-green-500"><UserCheck/>Disponibles ({availablePlayers.length})</h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">{renderPlayerList(availablePlayers)}</div>
                    </div>
                    <div className='space-y-2'>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-red-500"><UserX/>Indisponibles ({unavailablePlayers.length})</h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">{renderPlayerList(unavailablePlayers)}</div>
                    </div>
                    <div className='space-y-2'>
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground"><HelpCircle/>En attente ({undecidedPlayers.length})</h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">{renderPlayerList(undecidedPlayers)}</div>
                    </div>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

