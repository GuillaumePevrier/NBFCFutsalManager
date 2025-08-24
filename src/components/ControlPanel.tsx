'use client';

import type { Player, PlayerPosition, Role, MatchPoll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, Trash2, Users, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ControlPanelProps {
  allPlayers: Player[];
  team: PlayerPosition[];
  substitutes: PlayerPosition[];
  poll: MatchPoll;
  role: Role;
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onReset: () => void;
  onSave: () => void;
}

const ControlPanel = ({
  allPlayers,
  team,
  substitutes,
  poll,
  role,
  onAddPlayer,
  onRemovePlayer,
  onReset,
  onSave,
}: ControlPanelProps) => {
  
  const fullTeam = [...team, ...substitutes];
  
  const availableForSelection = poll.status === 'active' || poll.status === 'closed' 
    ? allPlayers.filter(p => poll.availabilities.find(a => a.playerId === p.id && a.status === 'available'))
    : allPlayers;

  const selectablePlayers = availableForSelection.filter(p => !fullTeam.some(teamPlayer => teamPlayer.id === p.id));
  
  const getSelectPlaceholder = () => {
    if (poll.status === 'inactive') {
      return "Démarrez un sondage pour sélectionner";
    }
    if (selectablePlayers.length > 0) {
      return "Sélectionner un joueur...";
    }
    if (availableForSelection.length === 0) {
        return "Aucun joueur disponible";
    }
    return "Tous les joueurs disponibles sont ajoutés";
  };


  return (
    <Card className="w-full md:w-80 lg:w-96 bg-card border-l-0 md:border-l flex flex-col h-auto md:h-screen rounded-none">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Users className="text-primary" />
          <span>Composition d'équipe</span>
        </CardTitle>
        <CardDescription>Mode {role === 'coach' ? 'Coach (activé)' : 'Joueur'}</CardDescription>
      </CardHeader>

      <ScrollArea className="flex-grow">
        <CardContent className="flex-grow flex flex-col gap-4 p-4 h-full">
          {role === 'coach' && (
            <div className="space-y-4">
              <Label>Ajouter un joueur</Label>
              <Select onValueChange={onAddPlayer} disabled={poll.status === 'inactive' || selectablePlayers.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={getSelectPlaceholder()} />
                </SelectTrigger>
                <SelectContent>
                  {selectablePlayers.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Titulaires ({team.length}/5)</Label>
            <div className="space-y-2 min-h-[60px]">
              {team.length > 0 ? team.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={player.avatar_url} alt={player.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{player.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  {role === 'coach' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemovePlayer(player.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )) : <p className="text-sm text-muted-foreground pt-2">Ajoutez des joueurs sur le terrain.</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remplaçants ({substitutes.length})</Label>
            <div className="space-y-2 min-h-[60px]">
              {substitutes.length > 0 ? substitutes.map(player => (
                <div key={player.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar_url} alt={player.name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">{player.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player.name}</span>
                  </div>
                  {role === 'coach' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemovePlayer(player.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )) : <p className="text-sm text-muted-foreground pt-2">Les joueurs ajoutés après le 5ème seront ici.</p>}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
      
      {role === 'coach' && (
        <div className="mt-auto p-4 space-y-2 flex-shrink-0 border-t">
          <div className="flex gap-2">
              <Button variant="outline" className="w-full" onClick={onSave}>
              <Save className="mr-2 h-4 w-4" /> Sauvegarder
            </Button>
            <Button variant="destructive" className="w-full" onClick={onReset}>
              <Trash2 className="mr-2 h-4 w-4" /> Réinitialiser
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ControlPanel;
