
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyRound, ArrowLeft, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getPlayers } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Player, Role } from "@/lib/types";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { AccessActions } from './access-actions';


export default function AccessAdminPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

     const fetchPlayersData = async () => {
        setLoading(true);
        const data = await getPlayers();
        setPlayers(data);
        setLoading(false);
    };

    useEffect(() => {
        const checkRoleAndProtect = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';

            if (currentRole !== 'coach') {
                router.push('/');
                return;
            }
            
            fetchPlayersData();
        };
        checkRoleAndProtect();

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            const newRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            if (newRole !== 'coach') {
                router.push('/');
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase.auth, router]);
    
    const getInitials = (name: string) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    
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
                <Button asChild variant="outline" size="sm" className='btn neon-blue-sm'>
                   <Link href="/" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Accueil
                   </Link>
                 </Button>
            </Header>
            <main className="flex-grow p-4 md:p-8 main-bg">
                <div className="w-full max-w-5xl mx-auto">
                     <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-6">
                        <KeyRound className="w-8 h-8 text-primary" />
                        Gestion des Accès Joueurs
                    </h1>
                    <Card className="border-primary/20 shadow-lg shadow-primary/10">
                        <CardHeader>
                            <CardTitle>Liste des Joueurs ({players.length})</CardTitle>
                            <CardDescription>
                                Créez ou modifiez les comptes de connexion pour chaque joueur de l'effectif.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Joueur</TableHead>
                                        <TableHead>Email de Connexion</TableHead>
                                        <TableHead className="text-center">Statut du Compte</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {players.length > 0 ? (
                                        players.map((player) => (
                                            <TableRow key={player.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage src={player.avatar_url} alt={player.name} />
                                                            <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{player.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-sm">
                                                    {player.email || "non défini"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {player.user_id ? (
                                                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border border-green-500/30">
                                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                                            Compte Actif
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive" className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                             <ShieldAlert className="mr-2 h-4 w-4" />
                                                            Aucun Accès
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                 <TableCell className="text-right">
                                                   <AccessActions player={player} onUpdate={fetchPlayersData} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                         <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                Aucun joueur trouvé.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

