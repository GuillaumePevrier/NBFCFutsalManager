'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { PlayerPosition } from "@/lib/types";
import { useState } from "react";
import { sendOneSignalNotification } from "@/ai/flows/send-onesignal-notification";
import { Loader2 } from "lucide-react";

interface InvitationDialogProps {
    team: PlayerPosition[];
    children: React.ReactNode;
}

export default function InvitationDialog({ team, children }: InvitationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const notificationPayload = {
        title: `Convocation Match vs ${data.opponent}`,
        message: data.message as string || `Rendez-vous à ${data.location} à ${data.time}`,
    };

    const result = await sendOneSignalNotification(notificationPayload);

    setIsLoading(false);

    if (result.success) {
        toast({
            title: "Notification Envoyée!",
            description: `Votre notification de match a été envoyée. (${result.sentCount} abonnés)`,
            variant: "default",
        });
    } else {
        toast({
            title: "Erreur d'envoi",
            description: "La notification n'a pas pu être envoyée.",
            variant: "destructive",
        });
    }

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle>Envoyer une Notification de Match</DialogTitle>
            <DialogDescription>
                Remplissez les détails du match à venir. La notification sera envoyée à tous les utilisateurs abonnés.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="opponent" className="text-right">
                    Adversaire
                    </Label>
                    <Input id="opponent" name="opponent" required className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                    Date
                    </Label>
                    <Input id="date" name="date" type="date" required className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right">
                    Heure
                    </Label>
                    <Input id="time" name="time" type="time" required className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                    Lieu
                    </Label>
                    <Input id="location" name="location" required className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="message" className="text-right pt-2">
                    Message
                    </Label>
                    <Textarea id="message" name="message" placeholder="Message optionnel..." className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer la Notification
            </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
