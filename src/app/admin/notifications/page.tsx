

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
import { sendNotificationToAllPlayers } from '@/app/actions';


function ManualNotificationForm() {
    const { toast } = useToast();

    async function formAction(formData: FormData) {
        const payload = {
            title: formData.get('title') as string,
            body: formData.get('body') as string,
        };

        if (!payload.title || !payload.body) {
            toast({ title: "Champs requis", description: "Le titre et le message sont obligatoires.", variant: "destructive" });
            return;
        }

        // This function is now a placeholder, it will log to the console.
        const result = await sendNotificationToAllPlayers(payload);

        if (result.success) {
            toast({
                title: "Notification en attente",
                description: "La logique d'envoi sera bientôt connectée à Firebase."
            });
            const form = document.getElementById('manual-notification-form') as HTMLFormElement;
            form.reset();
        } else {
             toast({
                title: "Erreur",
                description: "La notification n'a pas pu être traitée.",
                variant: "destructive"
            });
        }
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
                    Envoyez un message personnalisé à tous les joueurs. (Bientôt avec Firebase)
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
    }, [supabase, router]);
    
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
                    </div>
                </div>
            </main>
        </div>
    );
}
