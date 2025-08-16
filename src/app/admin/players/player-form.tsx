'use client'

import { useEffect, useState } from 'react';
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
import { z } from 'zod';

const PlayerSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  team: z.enum(['D1', 'D2', 'Autre']),
  position: z.enum(['Gardien', 'Défenseur', 'Ailier', 'Pivot', 'unspecified']).optional(),
  preferred_foot: z.enum(['Droit', 'Gauche', 'Ambidextre', 'unspecified']).optional(),
  avatar_url: z.string().url("L'URL de l'avatar n'est pas valide.").optional().or(z.literal('')),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof PlayerSchema>>;

export function PlayerForm({ player }: { player?: Player }) {
    const isEditing = !!player;
    const { toast } = useToast();
    const router = useRouter();
    const [errors, setErrors] = useState<FormErrors | null>(null);

    const formAction = async (formData: FormData) => {
        const values = Object.fromEntries(formData.entries());
        const validatedFields = PlayerSchema.safeParse(values);

        if (!validatedFields.success) {
            setErrors(validatedFields.error.format());
            return;
        }

        setErrors(null);
        
        try {
            if (isEditing) {
                formData.set('id', player.id);
                await updatePlayer(formData);
            } else {
                await createPlayer(formData);
            }
            // La redirection est gérée dans l'action serveur
            toast({
                title: isEditing ? "Joueur modifié" : "Joueur créé",
                description: `${validatedFields.data.name} a été ${isEditing ? 'mis à jour' : 'ajouté'}.`
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Une erreur est survenue.",
                variant: "destructive",
            });
        }
    };

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
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom complet</Label>
                            <Input id="name" name="name" defaultValue={player?.name} required />
                            {errors?.name && <p className="text-sm text-destructive">{errors.name._errors[0]}</p>}
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
                                {errors?.team && <p className="text-sm text-destructive">{errors.team._errors[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="position">Poste</Label>
                                <Select name="position" defaultValue={player?.position || 'unspecified'}>
                                    <SelectTrigger id="position">
                                        <SelectValue placeholder="Sélectionner le poste" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Gardien">Gardien</SelectItem>
                                        <SelectItem value="Défenseur">Défenseur</SelectItem>
                                        <SelectItem value="Ailier">Ailier</SelectItem>
                                        <SelectItem value="Pivot">Pivot</SelectItem>
                                        <SelectItem value="unspecified">Non spécifié</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="preferred_foot">Pied Fort</Label>
                                <Select name="preferred_foot" defaultValue={player?.preferred_foot || 'unspecified'}>
                                    <SelectTrigger id="preferred_foot">
                                        <SelectValue placeholder="Sélectionner le pied fort" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Droit">Droit</SelectItem>
                                        <SelectItem value="Gauche">Gauche</SelectItem>
                                        <SelectItem value="Ambidextre">Ambidextre</SelectItem>
                                        <SelectItem value="unspecified">Non spécifié</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="avatar_url">URL de l'avatar</Label>
                                <Input id="avatar_url" name="avatar_url" placeholder="https://..." defaultValue={player?.avatar_url || ''} />
                                {errors?.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url._errors[0]}</p>}
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
