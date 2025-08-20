
'use client';

import { getChannels } from "@/app/actions";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import type { Channel, Player } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { MessageSquarePlus, Loader2, Users, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | undefined>();
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchUserAndChannels = async () => {
            const { data: { session }} = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }
            setCurrentUserId(session.user.id);
            const channelData = await getChannels();
            setChannels(channelData);
            setLoading(false);
        };
        fetchUserAndChannels();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                router.push('/');
            } else {
                setCurrentUserId(session?.user?.id);
            }
        });
        
        // Listen for changes in your channels
        const channelSubscription = supabase
            .channel('public:channels')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'channels' },
                () => fetchUserAndChannels()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'channel_participants' },
                () => fetchUserAndChannels()
            )
            .subscribe();


        return () => {
            authListener.subscription.unsubscribe();
            supabase.removeChannel(channelSubscription);
        }

    }, [supabase, router]);

    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const getChannelDisplay = (channel: Channel) => {
        if (channel.type === 'group') {
            return {
                name: channel.name || 'Discussion de groupe',
                avatarUrl: null, // Could add group avatar later
                fallback: <Users />,
                isGroup: true,
            };
        } else {
            // For private channels, find the other participant
            const otherParticipant = channel.participants?.find(p => p.user_id !== currentUserId);
            return {
                name: otherParticipant?.name || 'Utilisateur supprimé',
                avatarUrl: otherParticipant?.avatar_url,
                fallback: getInitials(otherParticipant?.name),
                isGroup: false,
            };
        }
    };


    return (
        <div className="flex flex-col h-screen">
            <Header>
                <div className="flex-grow" />
            </Header>
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
                                   <Link href={`/chat/${channel.id}`} key={channel.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                                            <AvatarImage src={display.avatarUrl || undefined} />
                                            <AvatarFallback className={display.isGroup ? `bg-muted` : `bg-primary text-primary-foreground`}>
                                                {display.fallback}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <span className="font-medium">{display.name}</span>
                                            {/* TODO: Add last message preview here */}
                                        </div>
                                   </Link>
                                )
                           })}
                       </div>
                   ) : (
                       <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center">
                           <MessageSquarePlus className="w-12 h-12 text-muted-foreground/50 mb-4" />
                           <h3 className="font-semibold">Aucune conversation.</h3>
                           <p className="text-sm">Démarrez-en une en cliquant sur "Nouveau Message".</p>
                       </div>
                   )}
                </div>
            </main>
        </div>
    )
}
