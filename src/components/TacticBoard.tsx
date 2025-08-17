
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Role, TacticSequence } from '@/lib/types';
import { Film, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import TacticEditorDialog from './TacticEditorDialog';

interface TacticBoardProps {
    role: Role;
    sequences: TacticSequence[];
    onSequencesChange: (sequences: TacticSequence[]) => void;
}

export default function TacticBoard({ role, sequences, onSequencesChange }: TacticBoardProps) {
    const [editingSequence, setEditingSequence] = useState<TacticSequence | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const handleCreateSequence = () => {
        const newSequence: TacticSequence = {
            id: nanoid(),
            name: `Séquence ${sequences.length + 1}`,
            steps: [{ pawns: [], arrows: [] }] // Start with one empty step
        };
        onSequencesChange([...sequences, newSequence]);
    }

    const handleDeleteSequence = (id: string) => {
        onSequencesChange(sequences.filter(seq => seq.id !== id));
    }

    const handleSaveSequence = (updatedSequence: TacticSequence) => {
        onSequencesChange(sequences.map(seq => seq.id === updatedSequence.id ? updatedSequence : seq));
        setEditingSequence(null);
    }
    
    const openEditor = (sequence: TacticSequence, readOnly: boolean) => {
        setEditingSequence(sequence);
        setIsReadOnly(readOnly);
    }

    return (
        <>
            {editingSequence && (
                <TacticEditorDialog
                    isOpen={!!editingSequence}
                    onOpenChange={() => setEditingSequence(null)}
                    sequence={editingSequence}
                    onSave={handleSaveSequence}
                    isReadOnly={isReadOnly}
                />
            )}
            <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit"><path d="M12 5a3 3 0 1 0-5.993.129M12 5a3 3 0 1 0 5.993.129M12 5a3 3 a 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 12a3 3 0 1 0-5.993.129M12 12a3 3 0 1 0 5.993.129M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 19a3 3 0 1 0-5.993.129M12 19a3 3 0 1 0 5.993.129M12 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 5v7m0 7v-7"/><path d="m9.007 5.129-.004 7m.004 7v-7"/><path d="m14.993 5.129.004 7m-.004 7v-7"/></svg>
                                Tableau Noir Animé
                            </CardTitle>
                            <CardDescription>
                                {role === 'coach' ? 'Créez et gérez les séquences tactiques pour le match.' : 'Visionnez les schémas tactiques préparés par le coach.'}
                            </CardDescription>
                        </div>
                        {role === 'coach' && (
                            <Button size="sm" onClick={handleCreateSequence}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Créer une séquence
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {sequences.length > 0 ? (
                        <div className="space-y-2">
                            {sequences.map(seq => (
                                <div key={seq.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted">
                                    <span className="font-medium text-sm">{seq.name}</span>
                                    <div className="flex items-center gap-1">
                                         <Button variant="outline" size="sm" onClick={() => openEditor(seq, true)}>
                                            <Film className="mr-2 h-4 w-4" />
                                            Voir
                                        </Button>
                                        {role === 'coach' && (
                                            <>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(seq, false)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSequence(seq.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-4 border-dashed border-2 rounded-lg">
                            Aucune séquence tactique pour ce match.
                            {role === 'coach' && <p>Cliquez sur "Créer une séquence" pour commencer.</p>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
