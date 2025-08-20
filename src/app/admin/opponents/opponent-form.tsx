
'use client'

import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Opponent } from "@/lib/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createOpponent, updateOpponent } from "@/app/actions";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function OpponentForm({ opponent }: { opponent?: Opponent }) {
    const isEditing = !!opponent;
    const { toast } = useToast();

    const formAction = async (formData: FormData) => {
        try {
            if (isEditing) {
                formData.set('id', opponent.id);
                await updateOpponent(formData);
            } else {
                await createOpponent(formData);
            }
            const teamName = formData.get('team_name') || "L'équipe";
            toast({
                title: isEditing ? "Équipe modifiée" : "Équipe créée",
                description: `${teamName} a été ${isEditing ? 'mise à jour' : 'ajoutée'}.`
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="team_name">Nom de l'équipe</Label>
                                <Input id="team_name" name="team_name" defaultValue={opponent?.team_name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="club_name">Nom du club</Label>
                                <Input id="club_name" name="club_name" defaultValue={opponent?.club_name} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">URL du logo</Label>
                            <Input id="logo_url" name="logo_url" placeholder="https://..." defaultValue={opponent?.logo_url || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="championship">Championnat / Compétition</Label>
                            <Select name="championship" defaultValue={opponent?.championship}>
                                <SelectTrigger id="championship">
                                    <SelectValue placeholder="Sélectionner le championnat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="D2 Nationale">D2 Nationale</SelectItem>
                                    <SelectItem value="Régionale 1">Régionale 1</SelectItem>
                                    <SelectItem value="District 1">District 1</SelectItem>
                                    <SelectItem value="District 2">District 2</SelectItem>
                                    <SelectItem value="Coupe de Bretagne">Coupe de Bretagne</SelectItem>
                                    <SelectItem value="Coupe du District">Coupe du District</SelectItem>
                                    <SelectItem value="Coupe de France">Coupe de France</SelectItem>
                                    <SelectItem value="Amical">Amical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="coach_name">Nom du coach</Label>
                                <Input id="coach_name" name="coach_name" defaultValue={opponent?.coach_name} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="coach_email">Email du coach</Label>
                                <Input id="coach_email" name="coach_email" type="email" defaultValue={opponent?.coach_email || ''} />
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
