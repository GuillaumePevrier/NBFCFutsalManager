
'use client'

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Opponent } from "@/lib/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createOpponent, updateOpponent } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function OpponentForm({ opponent }: { opponent?: Opponent }) {
    const isEditing = !!opponent;
    const action = isEditing ? updateOpponent : createOpponent;
    const [state, formAction] = useActionState(action, { errors: {} });
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (state.data) {
            toast({
                title: isEditing ? "Équipe modifiée" : "Équipe créée",
                description: `${(state.data as Opponent[])[0].team_name} a été ${isEditing ? 'mise à jour' : 'ajoutée'}.`
            });
            router.push('/admin/opponents');
        } else if (state.error) {
             toast({
                title: "Erreur",
                description: state.error,
                variant: "destructive",
            });
        }
    }, [state, isEditing, router, toast]);

    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Sauvegarder les modifications" : "Ajouter l'équipe"}
            </Button>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground main-bg items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>{isEditing ? `Modifier ${opponent.team_name}` : "Ajouter une nouvelle équipe"}</CardTitle>
                    <CardDescription>Remplissez les informations ci-dessous.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6">
                         {isEditing && <input type="hidden" name="id" value={opponent.id} />}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="team_name">Nom de l'équipe</Label>
                                <Input id="team_name" name="team_name" defaultValue={opponent?.team_name} required />
                                {state.errors?.team_name && <p className="text-sm text-destructive">{state.errors.team_name[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="club_name">Nom du club</Label>
                                <Input id="club_name" name="club_name" defaultValue={opponent?.club_name} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">URL du logo</Label>
                            <Input id="logo_url" name="logo_url" placeholder="https://..." defaultValue={opponent?.logo_url} />
                            {state.errors?.logo_url && <p className="text-sm text-destructive">{state.errors.logo_url[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="championship">Championnat / Compétition</Label>
                            <Input id="championship" name="championship" defaultValue={opponent?.championship} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="coach_name">Nom du coach</Label>
                                <Input id="coach_name" name="coach_name" defaultValue={opponent?.coach_name} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="coach_email">Email du coach</Label>
                                <Input id="coach_email" name="coach_email" type="email" defaultValue={opponent?.coach_email} />
                                {state.errors?.coach_email && <p className="text-sm text-destructive">{state.errors.coach_email[0]}</p>}
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="coach_phone">Téléphone du coach</Label>
                                <Input id="coach_phone" name="coach_phone" defaultValue={opponent?.coach_phone} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="address">Adresse</Label>
                                <Input id="address" name="address" defaultValue={opponent?.address} />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                             <Button asChild variant="outline">
                                <Link href="/admin/opponents">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Annuler
                                </Link>
                             </Button>
                            <SubmitButton />
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
