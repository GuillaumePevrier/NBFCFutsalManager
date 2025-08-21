
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, ArrowLeft, View, Users, Medal, RefreshCw, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { getPlayers, resetAllPlayersStats } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlayerActions } from "./player-actions";
import { createClient } from "@/lib/supabase/client";
import type { Player, Role } from "@/lib/types";
import Header from "@/components/Header";
import AuthDialog from '@/components/AuthDialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import PointsScaleDialog from '@/components/PointsScaleDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const getRankingClass = (rank: number) => {
    switch (rank) {
        case 0: return 'bg-yellow-500/20 hover:bg-yellow-500/30'; // Gold
        case 1: return 'bg-gray-400/20 hover:bg-gray-400/30'; // Silver
        case 2: return 'bg-orange-600/20 hover:bg-orange-600/30'; // Bronze
        default: return '';
    }
}

const getRankingBadge = (rank: number) => {
     switch (rank) {
        case 0: return 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90 shadow-[0_0_8px_rgba(250,204,21,0.7)]'; // Gold
        case 1: return 'bg-gray-400 text-gray-900 hover:bg-gray-400/90 shadow-[0_0_8px_rgba(156,163,175,0.7)]'; // Silver
        case 2: return 'bg-orange-500 text-orange-950 hover:bg-orange-500/90 shadow-[0_0_8px_rgba(249,115,22,0.7)]'; // Bronze
        default: return null;
    }
}


export default function PlayersAdminPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [role, setRole] = useState<Role>('player');
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const supabase = createClient();
    const { toast } = useToast();

    const fetchPlayers = async () => {
        setIsRefreshing(true);
        const data = await getPlayers();
        setPlayers(data);
        setIsRefreshing(false);
    };
    
    const handleRefresh = async () => {
        await fetchPlayers();
        toast({
            title: "Classement Actualisé",
            description: "Les points des joueurs ont été synchronisés."
        });
    }

    const handleResetAllStats = async () => {
        const result = await resetAllPlayersStats();
        if (result.success) {
            toast({
                title: "Réinitialisation réussie",
                description: "Les statistiques de tous les joueurs ont été remises à zéro."
            });
            fetchPlayers();
        } else {
             toast({
                title: "Erreur",
                description: "La réinitialisation des statistiques a échoué.",
                variant: "destructive"
            });
        }
    }

    useEffect(() => {
        fetchPlayers();
    }, []);

    useEffect(() => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(currentRole);
        };
        checkRole();

        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            const newRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(newRole);
        });
        
        const playerChannel = supabase.channel('public:players')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
                fetchPlayers();
            })
            .subscribe();

        const presenceChannel = supabase.channel('presences')
            .on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState<{ online_at: string }>();
                const presences = Object.entries(presenceState).map(([userId, states]) => ({
                    user_id: userId,
                    status: (states as any[]).length > 0 ? 'online' : 'offline',
                }));
                
                setPlayers(currentPlayers => 
                    currentPlayers.map(player => {
                        const presence = presences.find(p => p.user_id === player.user_id);
                        return presence ? { ...player, presence_status: presence.status as 'online' | 'offline' } : player;
                    })
                );
            })
            .subscribe();


        return () => {
            authListener?.subscription.unsubscribe();
            supabase.removeChannel(playerChannel);
            supabase.removeChannel(presenceChannel);
        };
    }, [supabase]);

    const onAuthenticated = () => {
        const checkRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentRole = (session && session.user.email === 'guillaumepevrier@gmail.com') ? 'coach' : 'player';
            setRole(currentRole);
        };
        checkRole();
        setIsAuthOpen(false);
    }
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isCoach = role === 'coach';

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
            <AuthDialog isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} onAuthenticated={onAuthenticated} />
            <main className="flex-grow p-4 md:p-8 main-bg">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-2">
                            <CardTitle className="flex items-center gap-2">
                                <Users/>
                                Classement des Joueurs ({players.length})
                            </CardTitle>
                             <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} title="Actualiser le classement" className='btn neon-blue-sm'>
                                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                            </Button>
                         </div>
                        <div className="flex items-center gap-4">
                            <PointsScaleDialog />
                            {isCoach && (
                                <>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className='btn neon-primary-sm'>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Tout Réinitialiser
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible. Toutes les statistiques (points, buts, fautes) de TOUS les joueurs seront remises à zéro.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetAllStats} className="bg-destructive hover:bg-destructive/90">
                                                Oui, tout réinitialiser
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button asChild size="sm" className='btn neon-primary-sm'>
                                    <Link href="/admin/players/new">
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Ajouter un joueur
                                    </Link>
                                </Button>
                                </>
                            )}
                        </div>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardDescription>
                                Consultez le classement des joueurs en fonction de leurs points d'implication.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Joueur</TableHead>
                                        <TableHead className="hidden md:table-cell">Équipe</TableHead>
                                        <TableHead className="text-right">Buts</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {players.length > 0 ? (
                                        players.map((player: Player, index) => (
                                            <TableRow key={player.id} className={cn("transition-all duration-300", getRankingClass(index))}>
                                                <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-12 w-12" presenceStatus={player.presence_status}>
                                                            <AvatarImage src={player.avatar_url} alt={player.name} />
                                                            <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                                                            <span className="font-medium">{player.name}</span>
                                                             {index < 3 && (
                                                                <Badge variant="default" className={cn("w-fit", getRankingBadge(index))}>
                                                                    <Medal className="mr-1 h-3 w-3"/>
                                                                    {index === 0 ? 'Or' : index === 1 ? 'Argent' : 'Bronze'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{player.team}</TableCell>
                                                <TableCell className="text-right font-semibold text-lg">{player.goals || 0}</TableCell>
                                                <TableCell className="text-right font-bold text-lg text-primary">{player.points || 0}</TableCell>
                                                <TableCell>
                                                    {isCoach ? (
                                                        <PlayerActions player={player}/>
                                                    ) : (
                                                        <Button asChild variant="outline" size="sm" className='btn neon-blue-sm'>
                                                            <Link href={`/player/${player.id}`}>
                                                                <View className="mr-2 h-4 w-4" />
                                                                <span className="hidden sm:inline">Voir</span>
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24">
                                                Aucun joueur trouvé. {isCoach && "Commencez par en ajouter un."}
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
