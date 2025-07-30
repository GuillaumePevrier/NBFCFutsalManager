
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Player } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";

interface PlayerSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  players: Player[];
  onPlayerSelect: (player: Player) => void;
  title: string;
}

export default function PlayerSelectionDialog({ isOpen, onOpenChange, players, onPlayerSelect, title }: PlayerSelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Sélectionnez le joueur concerné dans la liste ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-64">
          <div className="space-y-2 py-4">
            {players.length > 0 ? players.map(player => (
              <div
                key={player.id}
                onClick={() => onPlayerSelect(player)}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={player.avatar_url} alt={player.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{player.name}</span>
              </div>
            )) : (
              <p className="text-sm text-center text-muted-foreground py-4">
                Aucun joueur sur le terrain.
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
