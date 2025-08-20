
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Role, Player } from "@/lib/types";
import Header from "@/components/Header";
import AuthDialog from '@/components/AuthDialog';
import { useRouter } from 'next/navigation';
import { getSubscribers, type Subscriber } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SubscribersList({ subscribers }: { subscribers: Subscriber[] }) {
    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users/>
                    Abonnés aux Notifications ({subscribers.length})
                </CardTitle>
                <CardDescription>
                    Liste des joueurs qui ont activé les notifications sur au moins un appareil.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Joueur</TableHead>
                            <TableHead className="text-right">Abonné depuis le</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscribers.length > 0 ? (
                            subscribers.map((subscriber) => (
                                <TableRow key={subscriber.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={subscriber.avatar_url} alt={subscriber.name} />
                                                <AvatarFallback>{getInitials(subscriber.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{subscriber.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {format(new Date(subscriber.subscribed_at), "d MMMM yyyy", { locale: fr })}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">
                                    Aucun joueur n'a encore activé les notifications.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function NotificationsAdminPage() {
    const [role, setRole] = useState<Role>('player');
    const [loading, setLoading] = useState(true);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
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
            
            const subs = await getSubscribers();
            setSubscribers(subs);
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

    const onAuthenticated = () => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(currentRole);
        };
        checkRole();
        setIsAuthOpen(false);
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
            <Header onAuthClick={() => setIsAuthOpen(true)}>
                <Button asChild variant="outline" size="sm">
                   <Link href="/" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Accueil
                   </Link>
                 </Button>
            </Header>
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={onAuthenticated} />
            <main className="flex-grow p-4 md:p-8 main-bg">
                <div className="w-full max-w-6xl mx-auto space-y-6">
                     <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary" />
                        Tableau de bord des Notifications
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Envoyer une Notification Manuelle</CardTitle>
                                <CardDescription>
                                    Envoyez un message personnalisé à tous les joueurs abonnés.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">Le formulaire de création sera ici.</p>
                            </CardContent>
                        </Card>
                        <SubscribersList subscribers={subscribers} />
                    </div>
                </div>
            </main>
        </div>
    );
}
