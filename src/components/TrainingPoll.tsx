
'use client';

import type { MatchPoll, Player, Role, PlayerAvailability } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, PowerOff, RefreshCw, UserCheck, UserX, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card, CardTitle } from './ui/card';
import AvailabilityDialog from './AvailabilityDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';


interface TrainingPollProps {
  poll: MatchPoll;
  allPlayers: Player[];
  onPollChange: (poll: MatchPoll) => void;
  role: Role;
  onPlayerResponse: (playerId: string, status: 'available' | 'unavailable') => void;
  trainingId: string;
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
    return <span className="text-lg font-mono text-destructive font-semibold">Sondage terminé</span>;
  }

  const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
    if (value === 0 && (interval === 'jours' || (interval === 'heures' && timeLeft.jours === 0))) return null;
    return (
      <span key={interval} className="text-lg font-mono text-yellow-400">
        {String(value).padStart(2, '0')}{interval.charAt(0)}
      </span>
    );
  });

  return <div className="flex items-baseline gap-1.5">{timerComponents}</div>;
};

export default function TrainingPoll({ poll, allPlayers, onPollChange, role, onPlayerResponse }: TrainingPollProps) {
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);


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
  
  const handlePlayerResponseWithDialog = (playerId: string, status: 'available' | 'unavailable') => {
      onPlayerResponse(playerId, status);
      setSelectedPlayer(null); // Close the dialog
  };

  const getPlayerById = (id: string) => allPlayers.find(p => p.id === id);
  const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '';

  const availablePlayers = poll.availabilities.filter(p => p.status === 'available');
  const unavailablePlayers = poll.availabilities.filter(p => p.status === 'unavailable');
  const undecidedPlayers = allPlayers.filter(player => 
    !poll.availabilities.some(a => a.playerId === player.id && a.status !== 'undecided')
  );

  const renderPlayerList = (playerIds: string[]) => {
     if (playerIds.length === 0) {
        return <p className="text-sm text-muted-foreground text-center col-span-full py-4">Aucun joueur.</p>
     }
    return playerIds.map(playerId => {
      const player = getPlayerById(playerId);
      if (!player) return null;
      return (
        <div key={playerId} onClick={() => setSelectedPlayer(player)} className="flex items-center justify-between p-2 rounded-md bg-muted hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={player.avatar_url} alt={player.name} />
                <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{player.name}</span>
            </div>
        </div>
      );
    });
  }

  return (
    <>
     {selectedPlayer && (
         <AvailabilityDialog
          player={selectedPlayer}
          isOpen={!!selectedPlayer}
          onOpenChange={(open) => !open && setSelectedPlayer(null)}
          onRespond={handlePlayerResponseWithDialog}
        />
      )}
    <Card className="w-full bg-background/50">
        <Accordion type="single" collapsible className="w-full" defaultValue='item-1'>
            <AccordionItem value="item-1">
                <AccordionTrigger className="p-4">
                    <div className="flex justify-between items-center w-full">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <Users />
                        Sondage de Présence
                        </CardTitle>
                        {poll.status === 'active' ? <Countdown deadline={poll.deadline} /> : <div className='text-sm text-muted-foreground'>Sondage inactif</div>}
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                    <div className="space-y-4">
                        {poll.status === 'inactive' && role === 'coach' && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 bg-muted rounded-lg">
                            <div className='flex items-center gap-2'>
                                <Label htmlFor="deadline-hours-training">Durée (heures):</Label>
                                <Input 
                                    id="deadline-hours-training"
                                    type="number"
                                    value={deadlineHours}
                                    onChange={(e) => setDeadlineHours(parseInt(e.target.value))}
                                    className="w-20"
                                />
                            </div>
                            <Button onClick={handleStartPoll}><Play className="mr-2 h-4 w-4"/>Démarrer</Button>
                        </div>
                        )}

                        {(poll.status === 'active' || poll.status === 'closed') && role === 'coach' && (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {poll.status === 'active' &&
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="destructive"><PowerOff className="mr-2 h-4 w-4"/>Arrêter</Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Arrêter le sondage ?</AlertDialogTitle><AlertDialogDescription>Cela fermera le sondage et empêchera les joueurs de répondre.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleStopPoll}>Arrêter</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            }
                            <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="outline"><RefreshCw className="mr-2 h-4 w-4"/>Réinitialiser</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Réinitialiser le sondage ?</AlertDialogTitle><AlertDialogDescription>Toutes les réponses seront effacées. Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleResetPoll}>Réinitialiser</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        )}
                        
                        {poll.status !== 'inactive' && (
                            <div className='space-y-4'>
                                <div className='bg-muted p-2 rounded-lg'>
                                    <Label className='text-sm font-semibold'>Répondre au sondage</Label>
                                    <Select onValueChange={(playerId) => setSelectedPlayer(getPlayerById(playerId) || null)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez votre nom pour répondre..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {undecidedPlayers.map(player => (
                                                <SelectItem key={player.id} value={player.id}>{player.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className='space-y-2'>
                                        <h3 className="font-semibold text-sm flex items-center gap-2 text-green-500"><UserCheck/>Présents ({availablePlayers.length})</h3>
                                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">{renderPlayerList(availablePlayers.map(p => p.playerId))}</div>
                                    </div>
                                    <div className='space-y-2'>
                                        <h3 className="font-semibold text-sm flex items-center gap-2 text-red-500"><UserX/>Absents ({unavailablePlayers.length})</h3>
                                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">{renderPlayerList(unavailablePlayers.map(p => p.playerId))}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </Card>
    </>
  );
}
