
'use client';

import { getPlayers, createOrGetPrivateChannel } from '@/app/actions';
import Header from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Player } from '@/lib/types';
import { ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

export default function NewMessagePage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const fetchPlayers = async () => {
            const data = await getPlayers();
            setPlayers(data.filter(p => !!p.user_id)); // Only show players who can receive messages
            setLoading(false);
        };
        fetchPlayers();
    }, []);
    
    const filteredPlayers = useMemo(() => 
        players.filter(player =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    [players, searchTerm]);

    const handlePlayerClick = async (player: Player) => {
        if (!player.user_id) {
            toast({ title: "Action impossible", description: "Ce joueur n'a pas de compte de connexion.", variant: "destructive"});
            return;
        };
        
        setIsCreating(player.id);
        const { channelId, error } = await createOrGetPrivateChannel(player.user_id);
        setIsCreating(null);

        if (error) {
            toast({ title: "Erreur", description: error, variant: "destructive" });
        } else if (channelId) {
            router.push(`/chat/${channelId}`);
        }
    }
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
         <div className="flex flex-col h-screen">
            <Header>
                 <Button asChild variant="outline" size="sm">
                   <Link href="/chat" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Retour
                   </Link>
                 </Button>
            </Header>
            <main className="flex-grow flex flex-col p-4 md:p-6 main-bg items-center">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Nouveau Message</CardTitle>
                        <CardDescription>Sélectionnez un joueur pour démarrer une conversation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input 
                            placeholder="Rechercher un joueur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mb-4"
                        />
                        {loading ? (
                             <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredPlayers.length > 0 ? filteredPlayers.map(player => (
                                    <div 
                                        key={player.id}
                                        onClick={() => handlePlayerClick(player)}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={player.avatar_url} />
                                                <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{player.name}</span>
                                        </div>
                                        {isCreating === player.id ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-center text-muted-foreground py-4">Aucun joueur trouvé.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
