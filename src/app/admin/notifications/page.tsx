
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';


function ManualNotificationForm() {
    const { toast } = useToast();

    async function formAction(formData: FormData) {
        const payload = {
            title: formData.get('title') as string,
            body: formData.get('body') as string,
            icon: formData.get('icon') as string || 'https://futsal.noyalbrecefc.com/wp-content/uploads/2024/07/logo@2x-1.png',
            data: {
                url: formData.get('url') as string || `${process.env.NEXT_PUBLIC_BASE_URL}`
            }
        };

        if (!payload.title || !payload.body) {
            toast({ title: "Champs requis", description: "Le titre et le message sont obligatoires.", variant: "destructive" });
            return;
        }

        // TODO: Re-implement with OneSignal
        // await sendNotificationToAllPlayers(payload);

        toast({
            title: "Fonctionnalité en cours de migration",
            description: "L'envoi de notifications sera bientôt disponible avec OneSignal."
        });
        
        const form = document.getElementById('manual-notification-form') as HTMLFormElement;
        form.reset();
    }
    
    function SubmitButton() {
        const { pending } = useFormStatus();
        return (
            <Button type="submit" disabled={pending} className="w-full">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Envoyer à tous les abonnés
            </Button>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Envoyer une Notification Manuelle</CardTitle>
                <CardDescription>
                    Envoyez un message personnalisé à tous les joueurs abonnés.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="manual-notification-form" action={formAction} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" name="title" placeholder="Ex: Rappel entraînement" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="body">Message</Label>
                        <Textarea id="body" name="body" placeholder="Ex: N'oubliez pas vos gourdes ce soir !" required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="icon">URL de l'icône (optionnel)</Label>
                        <Input id="icon" name="icon" placeholder="Lien vers une image .png" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="url">URL cible (optionnel)</Label>
                        <Input id="url" name="url" placeholder="Lien vers une page de l'app" />
                    </div>
                    <SubmitButton />
                </form>
            </CardContent>
        </Card>
    )
}

export default function NotificationsAdminPage() {
    const [role, setRole] = useState<Role>('player');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

     useEffect(() => {
        const checkRoleAndProtect = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(currentRole);

            if (currentRole !== 'coach') {
                router.push('/');
                return;
            }
            setLoading(false);
        };
        checkRoleAndProtect();

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            const newRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(newRole);
            if (newRole !== 'coach') {
                router.push('/');
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase.auth, router]);
    
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

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header>
                <Button asChild variant="outline" size="sm">
                   <Link href="/" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Accueil
                   </Link>
                 </Button>
            </Header>
            <main className="flex-grow p-4 md:p-8 main-bg">
                <div className="w-full max-w-2xl mx-auto space-y-6">
                     <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        Tableau de bord des Notifications
                    </h1>

                    <div className="grid grid-cols-1 gap-6 items-start">
                        <ManualNotificationForm />
                         <Card>
                            <CardHeader>
                                <CardTitle>Gestion des Abonnés</CardTitle>
                                <CardDescription>
                                    La liste des abonnés et la gestion des utilisateurs seront désormais disponibles directement sur votre tableau de bord OneSignal.
                                </CardDescription>
                            </CardHeader>
                         </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
