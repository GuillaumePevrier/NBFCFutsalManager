
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, KeyRound, User, Save, UserCircle, Bell } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { Player, UserProfileUpdate } from '@/lib/types';
import { getCurrentPlayer, updateUserProfile, updateUserAuth } from '@/app/actions';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NotificationButton from '@/components/NotificationButton';

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  team: z.enum(['D1', 'D2', 'Autre']),
  position: z.enum(['Gardien', 'Défenseur', 'Ailier', 'Pivot', 'unspecified', '']),
  preferred_foot: z.enum(['Droit', 'Gauche', 'Ambidextre', 'unspecified', '']),
});

const authSchema = z.object({
  email: z.string().email("Adresse email invalide.").optional().or(z.literal('')),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères.").optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
});


export default function ProfilePage() {
    const [player, setPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const { register: registerProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors } } = useForm<UserProfileUpdate>({
        resolver: zodResolver(profileSchema)
    });

    const { register: registerAuth, handleSubmit: handleAuthSubmit, formState: { errors: authErrors } } = useForm({
        resolver: zodResolver(authSchema)
    });

    useEffect(() => {
        const fetchPlayer = async () => {
            const { data: { session }} = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }
            const playerData = await getCurrentPlayer();
            if (playerData) {
                setPlayer(playerData);
                resetProfile(playerData);
            }
            setLoading(false);
        };
        fetchPlayer();
    }, [router, supabase, resetProfile]);

    const onProfileSubmit: SubmitHandler<UserProfileUpdate> = async (data) => {
        if (!player) return;
        setProfileLoading(true);

        const result = await updateUserProfile(player.id, data);

        if (result.success) {
            toast({ title: "Profil mis à jour", description: "Vos informations ont bien été enregistrées." });
        } else {
            toast({ title: "Erreur", description: result.error?.message || "La mise à jour a échoué.", variant: "destructive" });
        }
        setProfileLoading(false);
    };

    const onAuthSubmit: SubmitHandler<z.infer<typeof authSchema>> = async (data) => {
        setAuthLoading(true);

        const result = await updateUserAuth(data.email || undefined, data.password || undefined);

        if (result.success) {
            toast({ title: "Identifiants mis à jour", description: "Vos informations de connexion ont été modifiées." });
        } else {
            toast({ title: "Erreur", description: result.error?.message || "La mise à jour a échoué.", variant: "destructive" });
        }
        setAuthLoading(false);
    };
    
    if(loading) {
         return (
             <div className="flex flex-col min-h-screen bg-background text-foreground">
                <Header />
                <main className="flex-grow p-4 md:p-8 main-bg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </main>
            </div>
        )
    }
    
    if(!player) {
         return (
             <div className="flex flex-col min-h-screen bg-background text-foreground">
                <Header />
                <main className="flex-grow p-4 md:p-8 main-bg flex items-center justify-center">
                   <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Profil non trouvé</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Nous n'avons pas pu charger votre profil de joueur. Veuillez réessayer ou contacter un administrateur.</p>
                        </CardContent>
                   </Card>
                </main>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-grow p-4 md:p-8 main-bg flex items-center justify-center">
                <div className="w-full max-w-2xl space-y-8">
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-center justify-center">
                        <UserCircle className="w-10 h-10 text-primary" />
                        Mon Profil
                    </h1>

                    {/* Profile Information Form */}
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
                        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User />Informations Personnelles</CardTitle>
                                <CardDescription>Modifiez vos informations de joueur ici.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                 <div className="space-y-2">
                                    <Label htmlFor="name">Nom complet</Label>
                                    <Input id="name" {...registerProfile('name')} />
                                    {profileErrors.name && <p className="text-sm text-destructive">{profileErrors.name.message}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="space-y-2">
                                        <Label htmlFor="team">Équipe</Label>
                                        <Select onValueChange={(value) => resetProfile({ ...player, team: value as any })} defaultValue={player.team}>
                                            <SelectTrigger id="team" {...registerProfile('team')}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="D1">D1</SelectItem>
                                                <SelectItem value="D2">D2</SelectItem>
                                                <SelectItem value="Autre">Autre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="position">Poste</Label>
                                        <Select onValueChange={(value) => resetProfile({ ...player, position: value as any })} defaultValue={player.position || 'unspecified'}>
                                            <SelectTrigger id="position" {...registerProfile('position')}><SelectValue /></SelectTrigger>
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
                                    <Select onValueChange={(value) => resetProfile({ ...player, preferred_foot: value as any })} defaultValue={player.preferred_foot || 'unspecified'}>
                                        <SelectTrigger id="preferred_foot" {...registerProfile('preferred_foot')}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Droit">Droit</SelectItem>
                                            <SelectItem value="Gauche">Gauche</SelectItem>
                                            <SelectItem value="Ambidextre">Ambidextre</SelectItem>
                                            <SelectItem value="unspecified">Non spécifié</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button type="submit" disabled={profileLoading} className="neon-primary-sm">
                                    {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Enregistrer le profil
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                    
                    {/* Authentication Form */}
                    <form onSubmit={handleAuthSubmit(onAuthSubmit)}>
                        <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><KeyRound/> Compte & Sécurité</CardTitle>
                                <CardDescription>Modifiez votre email, votre mot de passe et gérez vos notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Notifications</Label>
                                    <NotificationButton />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email de connexion</Label>
                                    <Input id="email" type="email" {...registerAuth('email')} placeholder={player.email || "email@exemple.com"} />
                                    {authErrors.email && <p className="text-sm text-destructive">{authErrors.email.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nouveau mot de passe</Label>
                                    <Input id="password" type="password" {...registerAuth('password')} placeholder="Laisser vide pour ne pas changer" />
                                    {authErrors.password && <p className="text-sm text-destructive">{authErrors.password.message}</p>}
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                                    <Input id="confirmPassword" type="password" {...registerAuth('confirmPassword')} />
                                    {authErrors.confirmPassword && <p className="text-sm text-destructive">{authErrors.confirmPassword.message}</p>}
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button type="submit" disabled={authLoading} className="neon-primary-sm">
                                    {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Mettre à jour les identifiants
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </div>
            </main>
        </div>
    );
}

