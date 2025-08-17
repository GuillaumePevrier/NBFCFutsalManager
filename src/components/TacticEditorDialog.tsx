
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
import type { TacticPawn, TacticPawnType, TacticSequence } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import FutsalCourt from "./FutsalCourt";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, ArrowRight, Save, Play, PlusCircle, Trash2, Shield, User, CircleDot, MousePointer } from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";

interface TacticEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sequence: TacticSequence;
  onSave: (sequence: TacticSequence) => void;
}

type EditorTool = TacticPawnType | 'move' | 'delete';

export default function TacticEditorDialog({ isOpen, onOpenChange, sequence: initialSequence, onSave }: TacticEditorDialogProps) {
  const [sequence, setSequence] = useState<TacticSequence>(initialSequence);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<EditorTool>('move');
  const [selectedPawnId, setSelectedPawnId] = useState<string | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state if a new sequence is passed in
    setSequence(initialSequence);
    setActiveStepIndex(0);
  }, [initialSequence]);

  const handleSave = () => {
    onSave(sequence);
  };

  const updateCurrentStep = (updater: (draft: TacticPawn[]) => TacticPawn[]) => {
    const currentStep = sequence.steps[activeStepIndex];
    const newPawns = updater([...currentStep.pawns]);
    
    const newSteps = [...sequence.steps];
    newSteps[activeStepIndex] = { ...currentStep, pawns: newPawns };

    setSequence({ ...sequence, steps: newSteps });
  };

  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!courtRef.current || activeTool === 'move' || activeTool === 'delete') return;

    const rect = courtRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    let label = '';
    if(activeTool === 'player') {
        const playerCount = sequence.steps[activeStepIndex].pawns.filter(p => p.type === 'player').length;
        label = `J${playerCount + 1}`;
    } else if (activeTool === 'opponent') {
        const opponentCount = sequence.steps[activeStepIndex].pawns.filter(p => p.type === 'opponent').length;
        label = `A${opponentCount + 1}`;
    }

    const newPawn: TacticPawn = {
      id: nanoid(),
      type: activeTool,
      position: { x, y },
      label,
    };
    
    updateCurrentStep(draft => [...draft, newPawn]);
  };
  
  const handlePawnClick = (pawnId: string) => {
    if (activeTool === 'delete') {
      handleDeletePawn();
    } else {
      setSelectedPawnId(pawnId);
    }
  };

  const handleDeletePawn = () => {
    if (!selectedPawnId) return;
    updateCurrentStep(draft => draft.filter(p => p.id !== selectedPawnId));
    setSelectedPawnId(null);
  }

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
                <FutsalCourt 
                    ref={courtRef}
                    pawns={sequence.steps[activeStepIndex]?.pawns || []}
                    onClick={handleCourtClick}
                    onPawnClick={handlePawnClick}
                />
            </div>

            {/* Controls Panel */}
            <div className="flex flex-col gap-4 bg-muted/50 p-3 rounded-lg overflow-y-auto">
                 <div>
                    <h3 className="font-semibold mb-2">Outils</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={activeTool === 'move' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('move')}><MousePointer className="mr-2"/> Déplacer</Button>
                        <Button variant={activeTool === 'player' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('player')}><User className="mr-2"/> Pion Joueur</Button>
                        <Button variant={activeTool === 'opponent' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('opponent')}><Shield className="mr-2"/> Pion Adversaire</Button>
                        <Button variant={activeTool === 'ball' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('ball')}><CircleDot className="mr-2"/> Ballon</Button>
                    </div>
                </div>
                 {selectedPawnId && (
                     <div>
                        <h3 className="font-semibold mb-2">Pion Sélectionné</h3>
                         <Button variant="destructive" size="sm" className="w-full" onClick={handleDeletePawn}>
                            <Trash2 className="mr-2 h-4 w-4"/> Supprimer le pion
                         </Button>
                    </div>
                )}
                 <div>
                    <h3 className="font-semibold mb-2">Animation</h3>
                    <div className="flex items-center justify-between p-2 bg-background rounded-md">
                        <span className="text-sm font-medium">Étape {activeStepIndex + 1} / {sequence.steps.length}</span>
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
