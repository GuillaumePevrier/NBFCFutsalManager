
'use client';

import type { Player, Role } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shirt } from 'lucide-react';

interface JerseyWasherSelectorProps {
  allPlayers: Player[];
  selectedPlayerId?: string;
  onPlayerSelect: (playerId: string | null) => void;
  role: Role;
}

export default function JerseyWasherSelector({
  allPlayers,
  selectedPlayerId,
  onPlayerSelect,
  role,
}: JerseyWasherSelectorProps) {
  
  if (role !== 'coach') {
    return null; // Only the coach can see and manage this
  }

  const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId);

  return (
    <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Shirt className="h-5 w-5" />
          Responsable Maillots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          onValueChange={(value) => onPlayerSelect(value === 'none' ? null : value)}
          value={selectedPlayerId || 'none'}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Désigner un joueur pour le lavage des maillots..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun joueur désigné</SelectItem>
            {allPlayers.map(player => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPlayer && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-bold">{selectedPlayer.name}</span> est responsable des maillots pour ce match.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
