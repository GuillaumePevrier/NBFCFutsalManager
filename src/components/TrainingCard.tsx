
'use client';

import type { Training, Player, Role } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Info } from 'lucide-react';
import TrainingPoll from './TrainingPoll';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrainingCardProps {
  training: Training;
  allPlayers: Player[];
  role: Role;
  onPollChange: (poll: Training['poll']) => void;
  onPlayerResponse: (playerId: string, status: 'available' | 'unavailable') => void;
}

const InfoRow = ({ icon: Icon, text }: { icon: React.ElementType, text: string | undefined }) => {
    if (!text) return null;
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="w-4 h-4" />
            <span>{text}</span>
        </div>
    )
};

export default function TrainingCard({ training, allPlayers, role, onPollChange, onPlayerResponse }: TrainingCardProps) {
  
  const formattedDate = training.date ? format(parseISO(training.date), "EEEE d MMMM yyyy", { locale: fr }) : "Date non définie";
  const formattedTime = training.time;

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>{training.title}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
          <InfoRow icon={Calendar} text={formattedDate} />
          <InfoRow icon={Clock} text={formattedTime} />
          <InfoRow icon={MapPin} text={training.location} />
        </CardDescription>
        {training.description && <p className="text-sm pt-2"><Info className="inline-block w-4 h-4 mr-2" />{training.description}</p>}
      </CardHeader>
      <CardContent>
        <TrainingPoll
          poll={training.poll}
          allPlayers={allPlayers}
          onPollChange={onPollChange}
          role={role}
          onPlayerResponse={(playerId, status) => onPlayerResponse(playerId, status)}
          trainingId={training.id}
        />
      </CardContent>
    </Card>
  );
}
