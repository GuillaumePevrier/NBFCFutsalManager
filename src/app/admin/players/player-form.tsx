
'use client'

import { useFormStatus } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Player } from "@/lib/types";
import { ArrowLeft, KeyRound, UserPlus, FileEdit, Loader2 } from "lucide-react";
import { createPlayer, updatePlayer } from "@/app/actions";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export function PlayerForm({ player }: { player?: Player }) {
    const isEditing = !!player;
    const { toast } = useToast();

    const formAction = async (formData: FormData) => {
        const result = isEditing ? await updatePlayer(formData) : await createPlayer(formData);

        if (result?.error) {
            toast({
                title: "Erreur",
                description: result.error.message,
                variant: "destructive",
            });
        } else {
            const playerName = formData.get('name') || 'Le joueur';
            toast({
                title: isEditing ? "Joueur modifié" : "Joueur créé",
                description: `${playerName} a été ${isEditing ? 'mis à jour' : 'ajouté avec succès'}.`
            });
            // Redirect will happen inside the server action for both create and update
        }
    };


    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Sauvegarder les modifications" : "Créer le Joueur"}
            </Button>
        );
    }
    
    const EditForm = () => (
         <>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileEdit /> Modifier {player?.name}</CardTitle>
                <CardDescription>Mettez à jour les informations du profil et/ou les accès de connexion.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-6">
                 {/* Profile Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" name="name" defaultValue={player?.name} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="avatar_url">URL de l'avatar</Label>
                        <Input id="avatar_url" name="avatar_url" placeholder="https://..." defaultValue={player?.avatar_url || ''} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="team">Équipe</Label>
                        <Select name="team" defaultValue={player?.team || 'D1'}>
                            <SelectTrigger id="team"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="D1">D1</SelectItem>
                                <SelectItem value="D2">D2</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="position">Poste</Label>
                        <Select name="position" defaultValue={player?.position || 'unspecified'}>
                            <SelectTrigger id="position"><SelectValue /></SelectTrigger>
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
                 <div className="space-y-2">
                    <Label htmlFor="preferred_foot">Pied Fort</Label>
                    <Select name="preferred_foot" defaultValue={player?.preferred_foot || 'unspecified'}>
                        <SelectTrigger id="preferred_foot"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Droit">Droit</SelectItem>
                            <SelectItem value="Gauche">Gauche</SelectItem>
                            <SelectItem value="Ambidextre">Ambidextre</SelectItem>
                            <SelectItem value="unspecified">Non spécifié</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <Separator className="my-6" />
                 {/* Auth Fields */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound/> Compte Utilisateur</h3>
                     <p className="text-sm text-muted-foreground">
                        {player?.user_id 
                            ? "Modifiez l'email ou le mot de passe du joueur."
                            : "Ce joueur n'a pas encore de compte. Ajoutez un email et un mot de passe pour lui en créer un."
                        }
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email de connexion</Label>
                        <Input id="email" name="email" type="email" defaultValue={player?.email || ''} placeholder="email@exemple.com" />
                    </div>
                   
                    <div className="space-y-2">
                        <Label htmlFor="password">
                           Nouveau mot de passe (optionnel)
                        </Label>
                        <Input id="password" name="password" type="password" placeholder="Laisser vide pour ne pas changer" />
                    </div>
                 </div>
            </CardContent>
         </>
    );

    const CreateForm = () => (
         <>
             <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus /> Créer un nouveau Joueur</CardTitle>
                <CardDescription>Créez un profil joueur et son compte de connexion en une seule étape.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email de connexion</Label>
                    <Input id="email" name="email" type="email" required placeholder="email@exemple.com" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe initial</Label>
                    <Input id="password" name="password" type="password" required />
                </div>
            </CardContent>
         </>
    );

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground main-bg items-center justify-center p-4">
            <form action={formAction}>
                {isEditing && <input type="hidden" name="id" value={player.id} />}
                <Card className="w-full max-w-2xl">
                    {isEditing ? <EditForm /> : <CreateForm />}
                    <CardFooter className="flex justify-between items-center pt-6">
                         <Button asChild variant="outline">
                            <Link href="/admin/players">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Annuler
                            </Link>
                         </Button>
                        <SubmitButton />
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
