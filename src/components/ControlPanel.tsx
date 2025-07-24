'use client';

import type { Player, PlayerPosition, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Save, Send, Trash2, Users, X } from 'lucide-react';
import InvitationDialog from './InvitationDialog';

interface ControlPanelProps {
  allPlayers: Player[];
  team: PlayerPosition[];
  role: Role;
  onAddPlayer: (playerId: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onReset: () => void;
  onSetRole: (role: Role) => void;
  onSave: () => void;
}

const ControlPanel = ({
  allPlayers,
  team,
  role,
  onAddPlayer,
  onRemovePlayer,
  onReset,
  onSetRole,
  onSave,
}: ControlPanelProps) => {
  
  const availablePlayers = allPlayers.filter(p => !team.some(teamPlayer => teamPlayer.id === p.id));

  return (
    <Card className="w-full md:w-80 lg:w-96 bg-card border-l-0 md:border-l flex flex-col h-auto md:h-screen">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Users className="text-primary" />
          <span>FutsalTactics Board</span>
        </CardTitle>
        <div className="flex items-center space-x-2 pt-4">
          <Label htmlFor="role-switch" className={role === 'player' ? 'text-primary font-bold' : ''}>
            Player
          </Label>
          <Switch
            id="role-switch"
            checked={role === 'coach'}
            onCheckedChange={(checked) => onSetRole(checked ? 'coach' : 'player')}
          />
          <Label htmlFor="role-switch" className={role === 'coach' ? 'text-primary font-bold' : ''}>
            Coach
          </Label>
        </div>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col gap-4 overflow-y-auto p-4">
        {role === 'coach' && (
          <div className="space-y-4">
            <Label>Add Player to Squad</Label>
            <Select onValueChange={onAddPlayer} disabled={team.length >= 5}>
              <SelectTrigger>
                <SelectValue placeholder="Select a player..." />
              </SelectTrigger>
              <SelectContent>
                {availablePlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Current Squad ({team.length}/5)</Label>
          <div className="space-y-2">
            {team.length > 0 ? team.map(player => (
              <div key={player.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
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
            )) : <p className="text-sm text-muted-foreground">Select players to build your team.</p>}
          </div>
        </div>
        
        {role === 'coach' && (
          <div className="mt-auto pt-4 space-y-2 flex-shrink-0">
            <InvitationDialog team={team}>
              <Button className="w-full" disabled={team.length === 0}>
                <Send className="mr-2 h-4 w-4" /> Send Invitation
              </Button>
            </InvitationDialog>
            <div className="flex gap-2">
               <Button variant="outline" className="w-full" onClick={onSave}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
              <Button variant="destructive" className="w-full" onClick={onReset}>
                <Trash2 className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
