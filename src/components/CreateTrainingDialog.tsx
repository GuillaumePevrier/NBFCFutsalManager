
'use client';

import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createTraining } from "@/app/actions";
import { Footprints, Loader2 } from "lucide-react";
import { useState } from 'react';

interface CreateTrainingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}


export default function CreateTrainingDialog({ isOpen, onOpenChange }: CreateTrainingDialogProps) {
  const { toast } = useToast();
  const [formErrors, setFormErrors] = useState<any>({});

  const formAction = async (formData: FormData) => {
    const result = await createTraining(formData);
    
    if (result?.error) {
      setFormErrors(result.error);
       if(result.error.form) {
          toast({
            title: "Erreur",
            description: result.error.form,
            variant: "destructive",
          });
       }
    } else {
      const title = formData.get('title') || "L'entraînement";
      toast({
        title: "Entraînement Créé",
        description: `La session "${title}" a été planifiée.`
      });
      onOpenChange(false);
      setFormErrors({});
    }
  };


  function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Planifier
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Footprints />
                Planifier un entraînement
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations pour la nouvelle session d'entraînement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" required placeholder="Ex: Spécifique gardiens, Tactique..." />
              {formErrors?.title && <p className="text-sm text-destructive">{formErrors.title[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required />
                    {formErrors?.date && <p className="text-sm text-destructive">{formErrors.date[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="time">Heure</Label>
                    <Input id="time" name="time" type="time" required />
                    {formErrors?.time && <p className="text-sm text-destructive">{formErrors.time[0]}</p>}
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input id="location" name="location" placeholder="Ex: Gymnase de Brécé" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Instructions, focus de la session..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
