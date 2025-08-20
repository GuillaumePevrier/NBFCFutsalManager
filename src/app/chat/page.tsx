
'use client';

import { getChannels } from "@/app/actions";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import type { Channel } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { redirect, useRouter } from "next/navigation";
import Link from 'next/link';
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchChannels = async () => {
            const { data: { session }} = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }
            const channelData = await getChannels();
            setChannels(channelData);
            setLoading(false);
        };
        fetchChannels();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/');
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        }

    }, [supabase, router]);

    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const getChannelDisplay = (channel: Channel) => {
        if (channel.type === 'group') {
            return {
                name: channel.name || 'Discussion de groupe',
                avatarUrl: null, // Could add group avatar later
                fallback: 'G'
            };
        } else {
            // For private channels, find the other participant
            const otherParticipant = channel.participants?.find(p => p.id !== supabase.auth.user()?.id);
            return {
                name: otherParticipant?.name || 'Utilisateur supprimé',
                avatarUrl: otherParticipant?.avatar_url,
                fallback: getInitials(otherParticipant?.name)
            };
        }
    };


    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-grow flex flex-col p-4 md:p-6 main-bg">
                 <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold">Messagerie</h1>
                    <Button size="sm" asChild>
                        <Link href="/chat/new">
                            <MessageSquarePlus className="mr-2 h-4 w-4"/>
                            Nouveau Message
                        </Link>
                    </Button>
                </div>
                <div className="flex-grow bg-card p-4 rounded-lg shadow-md">
                   {loading ? (
                        <div className="flex justify-center items-center h-full">
                           <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                   ) : channels.length > 0 ? (
                       <div className="space-y-2">
                           {channels.map(channel => {
                                const display = getChannelDisplay(channel);
                                return (
                                   <Link href={`/chat/${channel.id}`} key={channel.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer">
                                        <Avatar>
                                            <AvatarImage src={display.avatarUrl || undefined} />
                                            <AvatarFallback>{display.fallback}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{display.name}</span>
                                   </Link>
                                )
                           })}
                       </div>
                   ) : (
                       <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                           <p>Aucune conversation. Démarrez-en une !</p>
                       </div>
                   )}
                </div>
            </main>
        </div>
    )
}
