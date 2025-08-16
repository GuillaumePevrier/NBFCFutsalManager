
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import type { Player } from "@/lib/types";
import { Check, X } from "lucide-react";
import { Card } from "./ui/card";

interface AvailabilityDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player;
  onRespond: (playerId: string, status: 'available' | 'unavailable') => void;
}

export default function AvailabilityDialog({ isOpen, onOpenChange, player, onRespond }: AvailabilityDialogProps) {
  const fallbackInitials = player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-transparent border-none shadow-none">
        <Card className="w-full mx-auto bg-gradient-to-br from-card to-background/80 backdrop-blur-lg border-2 border-primary/20 shadow-2xl rounded-2xl overflow-hidden">
            <DialogHeader className="p-6 bg-gradient-to-b from-primary/20 via-transparent to-transparent relative">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10" 
                    style={{ backgroundImage: "url('https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png')" }}
                />
                <div className="flex flex-col items-center gap-4 relative">
                    <Avatar className="w-32 h-32 border-4 border-accent shadow-lg">
                        <AvatarImage src={player.avatar_url} alt={player.name} className="object-cover" />
                        <AvatarFallback className="text-5xl bg-primary text-primary-foreground">{fallbackInitials}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <DialogTitle className="text-3xl font-bold text-card-foreground tracking-tight">{player.name}</DialogTitle>
                    </div>
                </div>
            </DialogHeader>
            <div className="p-6 text-center space-y-4">
                <p className="text-lg font-semibold text-card-foreground">Seras-tu des nôtres ?</p>
                <div className="flex justify-center gap-4">
                    <Button 
                        size="lg" 
                        className="flex-1 bg-green-500 hover:bg-green-600 text-green-foreground shadow-lg shadow-green-500/30"
                        onClick={() => onRespond(player.id, 'available')}
                    >
                        <Check className="mr-2" /> Présent
                    </Button>
                     <Button 
                        size="lg" 
                        variant="destructive"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-red-foreground shadow-lg shadow-red-500/30"
                        onClick={() => onRespond(player.id, 'unavailable')}
                    >
                        <X className="mr-2" /> Absent
                    </Button>
                </div>
            </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
