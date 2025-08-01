'use client'

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Player } from "@/lib/types";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { createPlayer, updatePlayer } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function PlayerForm({ player }: { player?: Player }) {
    const isEditing = !!player;
    const action = isEditing ? updatePlayer : createPlayer;
    const [state, formAction] = useActionState(action, { errors: {} });
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (state.data) {
            toast({
                title: isEditing ? "Joueur modifié" : "Joueur créé",
                description: `${(state.data as Player[])[0].name} a été ${isEditing ? 'mis à jour' : 'ajouté'}.`
            });
            router.push('/admin/players');
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
                {isEditing ? "Sauvegarder les modifications" : "Ajouter le joueur"}
            </Button>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground main-bg items-center justify-center p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>{isEditing ? `Modifier ${player.name}` : "Ajouter un nouveau joueur"}</CardTitle>
                    <CardDescription>Remplissez les informations ci-dessous.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6">
                         {isEditing && <input type="hidden" name="id" value={player.id} />}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" name="name" defaultValue={player?.name} required />
                            {state.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="team">Équipe</Label>
                                <Select name="team" defaultValue={player?.team || 'D1'}>
                                    <SelectTrigger id="team">
                                        <SelectValue placeholder="Sélectionner l'équipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="D1">D1</SelectItem>
                                        <SelectItem value="D2">D2</SelectItem>
                                        <SelectItem value="Autre">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Poste</Label>
                                <Select name="position" defaultValue={player?.position}>
                                    <SelectTrigger id="position">
                                        <SelectValue placeholder="Sélectionner le poste" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gardien">Gardien</SelectItem>
                                        <SelectItem value="Défenseur">Défenseur</SelectItem>
                                        <SelectItem value="Ailier">Ailier</SelectItem>
                                        <SelectItem value="Pivot">Pivot</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="preferred_foot">Pied Fort</Label>
                                <Select name="preferred_foot" defaultValue={player?.preferred_foot}>
                                    <SelectTrigger id="preferred_foot">
                                        <SelectValue placeholder="Sélectionner le pied fort" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Droit">Droit</SelectItem>
                                        <SelectItem value="Gauche">Gauche</SelectItem>
                                        <SelectItem value="Ambidextre">Ambidextre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="avatar_url">URL de l'avatar</Label>
                                <Input id="avatar_url" name="avatar_url" placeholder="https://..." defaultValue={player?.avatar_url} />
                                 {state.errors?.avatar_url && <p className="text-sm text-destructive">{state.errors.avatar_url[0]}</p>}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                             <Button asChild variant="outline">
                                <Link href="/admin/players">
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
