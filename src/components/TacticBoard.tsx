
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Role, TacticSequence } from '@/lib/types';
import { Film, Pencil, PlusCircle } from 'lucide-react';
import { nanoid } from 'nanoid';

interface TacticBoardProps {
    role: Role;
    sequences: TacticSequence[];
    onSequencesChange: (sequences: TacticSequence[]) => void;
}

export default function TacticBoard({ role, sequences, onSequencesChange }: TacticBoardProps) {

    const handleCreateSequence = () => {
        const newSequence: TacticSequence = {
            id: nanoid(),
            name: `Séquence ${sequences.length + 1}`,
            steps: [{ pawns: [], arrows: [] }] // Start with one empty step
        };
        onSequencesChange([...sequences, newSequence]);
    }

    return (
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-base font-semibold">Tableau Noir Animé</CardTitle>
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
                            <div key={seq.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                                <span className="font-medium">{seq.name}</span>
                                {role === 'coach' ? (
                                    <Button variant="ghost" size="sm" disabled>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Éditer
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="sm" disabled>
                                        <Film className="mr-2 h-4 w-4" />
                                        Voir
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="text-center text-sm text-muted-foreground py-4">
                        Aucune séquence tactique pour ce match.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
