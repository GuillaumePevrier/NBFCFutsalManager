
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
import { z } from 'zod';

interface CreateTrainingDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const TrainingSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères."),
  date: z.string().min(1, "La date est requise."),
  time: z.string().min(1, "L'heure est requise."),
  location: z.string().optional(),
  description: z.string().optional(),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof TrainingSchema>> | null;

export default function CreateTrainingDialog({ isOpen, onOpenChange }: CreateTrainingDialogProps) {
  const { toast } = useToast();
  const [errors, setErrors] = useState<FormErrors>(null);

  const formAction = async (formData: FormData) => {
    const values = Object.fromEntries(formData.entries());
    const validatedFields = TrainingSchema.safeParse(values);

    if (!validatedFields.success) {
      setErrors(validatedFields.error.format());
      return;
    }

    setErrors(null);

    try {
      await createTraining(formData);
      toast({
        title: "Entraînement Créé",
        description: `La session "${validatedFields.data.title}" a été planifiée.`
      });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Erreur",
        description: "La création de l'entraînement a échoué.",
        variant: "destructive",
      });
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
              {errors?.title && <p className="text-sm text-destructive">{errors.title._errors[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required />
                    {errors?.date && <p className="text-sm text-destructive">{errors.date._errors[0]}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="time">Heure</Label>
                    <Input id="time" name="time" type="time" required />
                    {errors?.time && <p className="text-sm text-destructive">{errors.time._errors[0]}</p>}
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

    