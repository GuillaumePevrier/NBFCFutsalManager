
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
import type { TacticPawn as TacticPawnType, TacticPawn, TacticSequence, TacticArrow } from "@/lib/types";
import { useState, useRef, useEffect, useCallback } from "react";
import FutsalCourt from "./FutsalCourt";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, ArrowRight, Save, Play, PlusCircle, Trash2, Shield, User, CircleDot, MousePointer, MoveUpRight, Pause, RotateCcw } from "lucide-react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TacticEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sequence: TacticSequence;
  onSave: (sequence: TacticSequence) => void;
  isReadOnly?: boolean;
}

type EditorTool = TacticPawnType['type'] | 'move' | 'arrow';

interface DragState {
  pawnId: string;
  offsetX: number;
  offsetY: number;
}

interface ArrowDrawingState {
    from: { x: number, y: number };
}


export default function TacticEditorDialog({ isOpen, onOpenChange, sequence: initialSequence, onSave, isReadOnly = false }: TacticEditorDialogProps) {
  const [sequence, setSequence] = useState<TacticSequence>(initialSequence);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<EditorTool>('move');
  const [selectedPawnId, setSelectedPawnId] = useState<string | null>(null);
  const [draggingPawn, setDraggingPawn] = useState<DragState | null>(null);
  const [drawingArrow, setDrawingArrow] = useState<ArrowDrawingState | null>(null);
  const [previewArrow, setPreviewArrow] = useState<TacticArrow | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset state if a new sequence is passed in
    setSequence(initialSequence);
    setActiveStepIndex(0);
    setSelectedPawnId(null);
    setDraggingPawn(null);
    setIsPlaying(false);
  }, [initialSequence]);
  
    const handleDragEnd = useCallback(() => setDraggingPawn(null), []);

    const handleArrowEnd = useCallback((clientX: number, clientY: number) => {
        if (!drawingArrow || !courtRef.current) return;
        const rect = courtRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        const newArrow: TacticArrow = {
            id: nanoid(),
            from: drawingArrow.from,
            to: { x, y },
            type: 'straight'
        };

        updateCurrentStep(draft => ({ ...draft, arrows: [...draft.arrows, newArrow]}));
        
        setDrawingArrow(null);
        setPreviewArrow(null);
    }, [drawingArrow]);


  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (draggingPawn) handleDragEnd();
      if (drawingArrow) handleArrowEnd(e.clientX, e.clientY);
    };
    
    const handleGlobalTouchEnd = (e: TouchEvent) => {
        if(draggingPawn) handleDragEnd();
        if(drawingArrow) {
            const touch = e.changedTouches[0];
            handleArrowEnd(touch.clientX, touch.clientY);
        }
    }

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (draggingPawn) handleDragMove(e.clientX, e.clientY);
        if (drawingArrow) handleArrowMove(e.clientX, e.clientY);
    }
    
    const handleGlobalTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        if(draggingPawn) handleDragMove(touch.clientX, touch.clientY);
        if(drawingArrow) handleArrowMove(touch.clientX, touch.clientY);
    }

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);
    };
  }, [draggingPawn, drawingArrow, handleDragEnd, handleArrowEnd]);

  const handleSave = () => {
    onSave(sequence);
    toast({ title: "Séquence sauvegardée !", description: `La séquence "${sequence.name}" a été mise à jour.`});
    onOpenChange(false);
  };

  const updateCurrentStep = (updater: (draft: TacticSequence['steps'][0]) => TacticSequence['steps'][0]) => {
      setSequence(currentSequence => {
          const currentStep = currentSequence.steps[activeStepIndex];
          const newStep = updater({ ...currentStep, pawns: [...currentStep.pawns], arrows: [...currentStep.arrows] });
          
          const newSteps = [...currentSequence.steps];
          newSteps[activeStepIndex] = newStep;

          return { ...currentSequence, steps: newSteps };
      });
  };
  
    const handleCourtInteraction = (clientX: number, clientY: number) => {
        if (isReadOnly || !courtRef.current) return;
        const rect = courtRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;

        if (activeTool === 'arrow') {
            setDrawingArrow({ from: { x, y } });
            setPreviewArrow({ id: 'preview', from: { x, y }, to: { x, y }, type: 'straight' });
        } else if (activeTool !== 'move') {
            let label = '';
            const currentPawns = sequence.steps[activeStepIndex].pawns;
            if(activeTool === 'player') {
                const playerCount = currentPawns.filter(p => p.type === 'player').length;
                label = `J${playerCount + 1}`;
            } else if (activeTool === 'opponent') {
                const opponentCount = currentPawns.filter(p => p.type === 'opponent').length;
                label = `A${opponentCount + 1}`;
            }

            const newPawn: TacticPawn = {
            id: nanoid(),
            type: activeTool,
            position: { x, y },
            label,
            };
            
            updateCurrentStep(draft => ({ ...draft, pawns: [...draft.pawns, newPawn] }));
            setSelectedPawnId(newPawn.id);
        }
    }


  const handleCourtMouseDown = (e: React.MouseEvent<HTMLDivElement>) => handleCourtInteraction(e.clientX, e.clientY);
  const handleCourtTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault(); // Prevent scrolling
      handleCourtInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };
  
  const handlePawnClick = (pawnId: string) => {
    if (isReadOnly) return;
    if (activeTool !== 'move') setActiveTool('move');
    setSelectedPawnId(pawnId);
  };

  const handleDeletePawn = () => {
    if (isReadOnly || !selectedPawnId) return;
    updateCurrentStep(draft => ({ 
      ...draft, 
      pawns: draft.pawns.filter(p => p.id !== selectedPawnId),
      arrows: draft.arrows.filter(a => a.from !== selectedPawnId && a.to !== selectedPawnId) // Basic cleanup, can be improved
    }));
    setSelectedPawnId(null);
  }

  const handlePawnInteractionStart = (clientX: number, clientY: number, pawnId: string, pawnElement: HTMLElement) => {
    if (isReadOnly || activeTool !== 'move' || !courtRef.current) return;
    
    setSelectedPawnId(pawnId);
    
    const pawnRect = pawnElement.getBoundingClientRect();

    setDraggingPawn({
        pawnId: pawnId,
        offsetX: clientX - pawnRect.left,
        offsetY: clientY - pawnRect.top,
    });
  }

  const handlePawnMouseDown = (e: React.MouseEvent<HTMLDivElement>, pawnId: string) => {
      e.preventDefault();
      handlePawnInteractionStart(e.clientX, e.clientY, pawnId, e.currentTarget);
  };

  const handlePawnTouchStart = (e: React.TouchEvent<HTMLDivElement>, pawnId: string) => {
      e.preventDefault();
      handlePawnInteractionStart(e.touches[0].clientX, e.touches[0].clientY, pawnId, e.currentTarget);
  };

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingPawn || !courtRef.current) return;
    
    const courtRect = courtRef.current.getBoundingClientRect();
    const x = clientX - courtRect.left - draggingPawn.offsetX;
    const y = clientY - courtRect.top - draggingPawn.offsetY;

    const newX = Math.max(0, Math.min(100, (x / courtRect.width) * 100));
    const newY = Math.max(0, Math.min(100, (y / courtRect.height) * 100));

    updateCurrentStep(draft => ({
        ...draft,
        pawns: draft.pawns.map(p => 
            p.id === draggingPawn.pawnId ? { ...p, position: { x: newX, y: newY } } : p
        )
    }));
  }, [draggingPawn]);

  const handleArrowMove = useCallback((clientX: number, clientY: number) => {
    if (!drawingArrow || !courtRef.current) return;
    const rect = courtRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setPreviewArrow(current => current ? { ...current, to: { x, y } } : null);
  }, [drawingArrow]);

  const addStep = () => {
    const currentStep = sequence.steps[activeStepIndex];
    // Duplicate the current step to the next index
    const newSteps = [
        ...sequence.steps.slice(0, activeStepIndex + 1),
        JSON.parse(JSON.stringify(currentStep)), // Deep copy
        ...sequence.steps.slice(activeStepIndex + 1)
    ];
    setSequence(s => ({ ...s, steps: newSteps }));
    setActiveStepIndex(i => i + 1);
  };
  
  const removeStep = () => {
    if (sequence.steps.length <= 1) {
        toast({ title: "Action impossible", description: "Une séquence doit contenir au moins une étape.", variant: "destructive"});
        return;
    }
    const newSteps = sequence.steps.filter((_, index) => index !== activeStepIndex);
    setSequence(s => ({ ...s, steps: newSteps }));
    setActiveStepIndex(i => Math.max(0, i - 1));
  };

  const togglePlay = () => {
      if (isPlaying) {
          if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);
          setIsPlaying(false);
      } else {
          setIsPlaying(true);
          animationIntervalRef.current = setInterval(() => {
              setActiveStepIndex(prevIndex => {
                  const nextIndex = (prevIndex + 1) % sequence.steps.length;
                  if (nextIndex === 0) { // loop finished
                      clearInterval(animationIntervalRef.current!);
                      setIsPlaying(false);
                  }
                  return nextIndex;
              });
          }, 1500);
      }
  };

  const resetAnimation = () => {
      if(animationIntervalRef.current) clearInterval(animationIntervalRef.current);
      setIsPlaying(false);
      setActiveStepIndex(0);
  }

  const currentArrows = sequence.steps[activeStepIndex]?.arrows || [];

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
                    disabled={isReadOnly}
                />
             </div>
          </DialogTitle>
          <DialogDescription>
            {isReadOnly ? "Mode lecture : visionnez l'animation." : "Mode édition : construisez votre animation étape par étape."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow grid md:grid-cols-3 gap-2 p-4 overflow-hidden">
            {/* Main Court Area */}
            <div className="md:col-span-2 h-full flex items-center justify-center overflow-hidden">
                <FutsalCourt 
                    ref={courtRef}
                    pawns={sequence.steps[activeStepIndex]?.pawns || []}
                    arrows={previewArrow ? [...currentArrows, previewArrow] : currentArrows}
                    onMouseDown={handleCourtMouseDown}
                    onTouchStart={handleCourtTouchStart}
                    onPawnClick={handlePawnClick}
                    onPawnMouseDown={handlePawnMouseDown}
                    onPawnTouchStart={handlePawnTouchStart}
                    selectedPawnId={selectedPawnId}
                />
            </div>

            {/* Controls Panel */}
            <div className="flex flex-col gap-4 bg-muted/50 p-3 rounded-lg overflow-y-auto">
                {!isReadOnly && (
                <>
                    <div>
                        <h3 className="font-semibold mb-2">Outils</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant={activeTool === 'move' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('move')}><MousePointer className="mr-2"/> Déplacer</Button>
                            <Button variant={activeTool === 'player' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('player')}><User className="mr-2"/> Pion Joueur</Button>
                            <Button variant={activeTool === 'opponent' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('opponent')}><Shield className="mr-2"/> Pion Adversaire</Button>
                            <Button variant={activeTool === 'ball' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('ball')}><CircleDot className="mr-2"/> Ballon</Button>
                            <Button variant={activeTool === 'arrow' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool('arrow')}><MoveUpRight className="mr-2"/> Flèche</Button>
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
                 </>
                )}

                 <div>
                    <h3 className="font-semibold mb-2">Animation</h3>
                    <div className="flex items-center justify-between p-2 bg-background rounded-md">
                        <span className="text-sm font-medium">Étape {activeStepIndex + 1} / {sequence.steps.length}</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setActiveStepIndex(i => Math.max(0, i - 1))} disabled={activeStepIndex === 0}><ArrowLeft className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={togglePlay}>
                                {isPlaying ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4" />}
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => setActiveStepIndex(i => Math.min(sequence.steps.length - 1, i + 1))} disabled={activeStepIndex === sequence.steps.length - 1}><ArrowRight className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" onClick={resetAnimation}><RotateCcw className="h-4 w-4"/></Button>
                        </div>
                    </div>
                    {!isReadOnly && (
                     <div className="flex items-center gap-2 mt-2">
                        <Button variant="secondary" size="sm" className="w-full" onClick={addStep}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Ajouter une étape
                        </Button>
                         <Button variant="destructive" size="sm" className="w-full" onClick={removeStep}>
                           <Trash2 className="mr-2 h-4 w-4"/> Supprimer l'étape
                        </Button>
                    </div>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">Fermer</Button>
          </DialogClose>
          {!isReadOnly && (
            <Button type="button" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder la Séquence
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
