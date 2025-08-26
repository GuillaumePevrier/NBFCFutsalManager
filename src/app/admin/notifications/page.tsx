
      
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, Send } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';


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
                            <CardTitle>Abonnés aux Notifications</CardTitle>
                            <CardDescription>
                                Suivez le nombre de joueurs qui ont activé les notifications. Cette section est en cours de développement.
                            </CardDescription>
                        </CardHeader>
                         <CardContent>
                            <p className="text-muted-foreground">Bientôt disponible : statistiques sur les abonnés.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

    