
      
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, Send, Users, User, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/lib/types";
import Header from "@/components/Header";
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getPlayers, sendNotificationToSelectedPlayers, sendNotificationToAllPlayers } from '@/app/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


export default function SendNotificationPage() {
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const checkRoleAndFetchPlayers = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || session.user.email !== 'guillaumepevrier@gmail.com') {
                router.push('/');
                return;
            }

            const playersWithAccounts = await getPlayers();
            setPlayers(playersWithAccounts.filter(p => p.user_id)); // Only players with user accounts can get notifications
            setLoading(false);
        };
        checkRoleAndFetchPlayers();
    }, [supabase, router]);

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        if (checked) {
            setSelectedPlayerIds(new Set(players.map(p => p.user_id!)));
        } else {
            setSelectedPlayerIds(new Set());
        }
    };

    const handlePlayerSelect = (playerId: string, checked: boolean) => {
        const newSet = new Set(selectedPlayerIds);
        if (checked) {
            newSet.add(playerId);
        } else {
            newSet.delete(playerId);
        }
        setSelectedPlayerIds(newSet);
        setSelectAll(newSet.size === players.length);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSending(true);

        const formData = new FormData(event.currentTarget);
        const payload = {
            title: formData.get('title') as string,
            body: formData.get('body') as string,
            data: {
                url: formData.get('url') as string || process.env.NEXT_PUBLIC_BASE_URL,
            }
        };

        if (!payload.title || !payload.body) {
            toast({ title: "Champs requis", description: "Le titre et le message sont obligatoires.", variant: "destructive" });
            setIsSending(false);
            return;
        }

        let result;
        if (selectAll || selectedPlayerIds.size === players.length) {
             result = await sendNotificationToAllPlayers(payload);
        } else if (selectedPlayerIds.size > 0) {
            result = await sendNotificationToSelectedPlayers(Array.from(selectedPlayerIds), payload);
        } else {
            toast({ title: "Aucun destinataire", description: "Veuillez sélectionner au moins un joueur.", variant: "destructive" });
            setIsSending(false);
            return;
        }


        if (result.success) {
            toast({
                title: "Notification envoyée",
                description: "Le message a été envoyé avec succès."
            });
            router.push('/admin/notifications');
        } else {
             toast({
                title: "Erreur",
                description: "La notification n'a pas pu être envoyée.",
                variant: "destructive"
            });
        }
        setIsSending(false);
    }
    
    if (loading) {
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
                   <Link href="/admin/notifications" className="flex items-center">
                     <ArrowLeft className="mr-2 h-4 w-4" />
                     Retour
                   </Link>
                 </Button>
            </Header>
            <main className="flex-grow p-4 md:p-8 main-bg flex justify-center">
                 <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rédiger une Notification</CardTitle>
                            <CardDescription>
                                Remplissez les champs ci-dessous pour envoyer votre message.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Choisir les Destinataires</CardTitle>
                            <CardDescription>
                                Sélectionnez les joueurs qui recevront cette notification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                                <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                                <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                                    <Users className="h-5 w-5"/>
                                    Envoyer à tous les joueurs ({players.length})
                                </label>
                            </div>
                            <ScrollArea className="h-64 mt-2 pr-4">
                                <div className="space-y-1">
                                    {players.map(player => (
                                         <div key={player.id} className={cn("flex items-center justify-between p-2 rounded-md transition-colors", selectedPlayerIds.has(player.user_id!) ? 'bg-accent' : 'hover:bg-muted')}>
                                            <div className="flex items-center gap-3">
                                                 <Avatar className="h-9 w-9">
                                                    <AvatarImage src={player.avatar_url} alt={player.name} />
                                                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <Label htmlFor={`player-${player.id}`} className="font-medium">{player.name}</Label>
                                            </div>
                                            <Checkbox
                                                id={`player-${player.id}`}
                                                checked={selectedPlayerIds.has(player.user_id!)}
                                                onCheckedChange={(checked) => handlePlayerSelect(player.user_id!, checked as boolean)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                         <CardFooter className="flex justify-end">
                            <Button type="submit" disabled={isSending} className="w-full sm:w-auto">
                                {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Envoyer ({selectAll ? players.length : selectedPlayerIds.size})
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </main>
        </div>
    );
}

    