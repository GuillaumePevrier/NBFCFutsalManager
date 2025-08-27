'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BellRing, BellOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Player } from '@/lib/types';

interface SubscribersListProps {
    players: Player[];
}

export default function SubscribersList({ players }: SubscribersListProps) {
    const sortedPlayers = [...players].sort((a, b) => {
        const aIsSubscribed = !!a.onesignal_id;
        const bIsSubscribed = !!b.onesignal_id;
        if (aIsSubscribed !== bIsSubscribed) {
            return aIsSubscribed ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    const totalSubscribed = players.filter(p => !!p.onesignal_id).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Abonnés aux Notifications ({totalSubscribed} / {players.length})</CardTitle>
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
                            <TableHead className="text-right">ID Abonnement</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPlayers.map((player) => (
                            <TableRow key={player.id}>
                                <TableCell className="font-medium">{player.name}</TableCell>
                                <TableCell>
                                    {player.onesignal_id ? (
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
                                <TableCell className="text-right text-muted-foreground text-xs font-mono">
                                    {player.onesignal_id ? `${player.onesignal_id.substring(0, 8)}...` : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
