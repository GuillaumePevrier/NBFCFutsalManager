
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import type { TacticSequence } from "@/lib/types";
import { useState } from "react";
import FutsalCourt from "./FutsalCourt";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, ArrowRight, Save, Play, PlusCircle, Trash2 } from "lucide-react";

interface TacticEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sequence: TacticSequence;
  onSave: (sequence: TacticSequence) => void;
}

export default function TacticEditorDialog({ isOpen, onOpenChange, sequence: initialSequence, onSave }: TacticEditorDialogProps) {
  const [sequence, setSequence] = useState<TacticSequence>(initialSequence);

  const handleSave = () => {
    onSave(sequence);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-3">
             <div className="flex items-center gap-2">
                <Label htmlFor="sequence-name" className="sr-only">Nom de la séquence</Label>
                <Input 
                    id="sequence-name"
                    value={sequence.name}
                    onChange={(e) => setSequence(s => ({ ...s, name: e.target.value }))}
                    className="text-lg font-semibold border-0 focus-visible:ring-1"
                />
             </div>
          </DialogTitle>
          <DialogDescription>
            Mode édition : construisez votre animation étape par étape.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid md:grid-cols-3 gap-2 p-4 overflow-hidden">
            {/* Main Court Area */}
            <div className="md:col-span-2 h-full flex items-center justify-center overflow-hidden">
                <FutsalCourt />
            </div>

            {/* Controls Panel */}
            <div className="flex flex-col gap-4 bg-muted/50 p-3 rounded-lg overflow-y-auto">
                 <div>
                    <h3 className="font-semibold mb-2">Outils</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" disabled>Pion Joueur</Button>
                        <Button variant="outline" size="sm" disabled>Pion Adversaire</Button>
                        <Button variant="outline" size="sm" disabled>Ballon</Button>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Animation</h3>
                    <div className="flex items-center justify-between p-2 bg-background rounded-md">
                        <span className="text-sm font-medium">Étape 1 / {sequence.steps.length}</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" disabled><ArrowLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" disabled><Play className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" disabled><ArrowRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 mt-2">
                        <Button variant="secondary" size="sm" className="w-full" disabled>
                           <PlusCircle className="mr-2 h-4 w-4"/> Ajouter une étape
                        </Button>
                         <Button variant="destructive" size="sm" className="w-full" disabled>
                           <Trash2 className="mr-2 h-4 w-4"/> Supprimer l'étape
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Annuler</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder la Séquence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
