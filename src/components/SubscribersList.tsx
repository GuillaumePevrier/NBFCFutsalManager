
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { BellRing, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlayerSubscription {
    id: string;
    name: string;
    avatar_url: string;
    isSubscribed: boolean;
    subscribedAt: string | null;
}

export default function SubscribersList() {
    const [subscribers, setSubscribers] = useState<PlayerSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSubscribers = async () => {
            setLoading(true);

            // 1. Fetch all players
            const { data: players, error: playersError } = await supabase
                .from('players')
                .select('id, user_id, name, avatar_url');

            if (playersError) {
                console.error("Failed to fetch players:", playersError);
                setLoading(false);
                return;
            }

            // 2. Fetch all subscriptions
            const { data: subscriptions, error: subsError } = await supabase
                .from('push_subscriptions')
                .select('user_id, created_at');

            if (subsError) {
                console.error("Failed to fetch subscriptions:", subsError);
                setLoading(false);
                return;
            }
            
            // 3. Map players to their subscription status
            const playerSubscriptions = players.map(player => {
                const userSubs = subscriptions.filter(sub => sub.user_id === player.user_id);
                const isSubscribed = userSubs.length > 0;
                // Find the most recent subscription date for a user
                const mostRecentSub = isSubscribed 
                    ? userSubs.reduce((latest, current) => new Date(latest.created_at) > new Date(current.created_at) ? latest : current)
                    : null;

                return {
                    id: player.id,
                    name: player.name,
                    avatar_url: player.avatar_url || '',
                    isSubscribed,
                    subscribedAt: mostRecentSub ? mostRecentSub.created_at : null,
                };
            }).sort((a, b) => {
                // Sort by subscribed status first, then by name
                if (a.isSubscribed !== b.isSubscribed) {
                    return a.isSubscribed ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

            setSubscribers(playerSubscriptions);
            setLoading(false);
        };

        fetchSubscribers();
    }, [supabase]);

    const totalSubscribed = subscribers.filter(s => s.isSubscribed).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Abonnés aux Notifications ({totalSubscribed} / {subscribers.length})</CardTitle>
                <CardDescription>
                    Liste des joueurs et leur statut d'abonnement aux notifications push.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Joueur</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Dernier Abonnement</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Chargement de la liste...
                                </TableCell>
                            </TableRow>
                        ) : subscribers.length > 0 ? (
                            subscribers.map((player) => (
                                <TableRow key={player.id}>
                                    <TableCell className="font-medium">{player.name}</TableCell>
                                    <TableCell>
                                        {player.isSubscribed ? (
                                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                <BellRing className="mr-2 h-4 w-4" />
                                                Abonné
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <BellOff className="mr-2 h-4 w-4" />
                                                Non abonné
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {player.subscribedAt ? formatDistanceToNow(new Date(player.subscribedAt), { addSuffix: true, locale: fr }) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    Aucun joueur trouvé.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
