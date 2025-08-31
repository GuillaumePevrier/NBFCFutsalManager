'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Bell, Send, Loader2, TestTube2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Role, Player } from "@/lib/types";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation';
import SubscribersList from '@/components/SubscribersList';
import { getPlayers, sendNotificationToAllPlayers } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';


export default function NotificationsAdminPage() {
    const [role, setRole] = useState<Role>('player');
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    const fetchPlayers = async () => {
        const playersData = await getPlayers();
        setPlayers(playersData);
    };

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
            await fetchPlayers();
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
        
        // Listen for changes in players table to update subscription status
        const playerChannel = supabase.channel('public:players')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
                fetchPlayers();
            })
            .subscribe();

        return () => {
            authListener?.subscription.unsubscribe();
            supabase.removeChannel(playerChannel);
        };
    }, [supabase, router]);

    const handleSendTestNotification = async () => {
        setIsSendingTest(true);
        const result = await sendNotificationToAllPlayers({
            title: "Notification de Test 🚀",
            body: "Si vous recevez ceci, les notifications fonctionnent parfaitement !",
            url: `${process.env.NEXT_PUBLIC_BASE_URL}`
        });

        if (result.success) {
            if (result.sent > 0) {
                 toast({
                    title: "Notification de test envoyée",
                    description: `Le message a été envoyé à ${result.sent} abonné(s).`
                });
            } else {
                 toast({
                    title: "Envoi réussi, mais...",
                    description: "Aucun joueur n'est actuellement abonné aux notifications.",
                    variant: "default" // Using default as it's not a critical error
                });
            }
        } else {
             toast({
                title: "Erreur d'envoi",
                description: result.error || "La notification de test n'a pas pu être envoyée.",
                variant: "destructive"
            });
        }
        setIsSendingTest(false);
    }
    
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
                <div className="w-full max-w-4xl mx-auto space-y-6">
                     <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        Tableau de bord des Notifications
                    </h1>

                     <div className="grid md:grid-cols-2 gap-6">
                        <Card className="hover:border-primary/50 transition-colors">
                            <Link href="/admin/notifications/send">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3"><Send />Envoyer une Notification</CardTitle>
                                    <CardDescription>
                                        Rédigez un message et envoyez-le à tous les joueurs ou à une sélection spécifique.
                                    </CardDescription>
                                </CardHeader>
                            </Link>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3"><TestTube2 />Test de Notification</CardTitle>
                                <CardDescription>
                                    Envoyez une notification de test à tous les abonnés pour vérifier le système.
                                </CardDescription>
                            </CardHeader>
                             <CardFooter>
                                <Button onClick={handleSendTestNotification} disabled={isSendingTest} className="w-full">
                                    {isSendingTest ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                    Envoyer un test
                                </Button>
                            </CardFooter>
                        </Card>
                     </div>

                    <SubscribersList players={players} />

                </div>
            </main>
        </div>
    );
}
