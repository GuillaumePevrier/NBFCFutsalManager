
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Role } from '@/lib/types';
import { Film, Pencil } from 'lucide-react';

interface TacticBoardProps {
    role: Role;
}

export default function TacticBoard({ role }: TacticBoardProps) {

    return (
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Tableau Noir Animé</CardTitle>
                <CardDescription>
                    {role === 'coach' ? 'Créez et gérez les séquences tactiques pour le match.' : 'Visionnez les schémas tactiques préparés par le coach.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center gap-4 p-6">
                {role === 'coach' ? (
                     <Button disabled>
                        <Pencil className="mr-2 h-4 w-4" />
                        Créer une séquence
                    </Button>
                ) : (
                     <Button disabled>
                        <Film className="mr-2 h-4 w-4" />
                        Voir les séquences
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
