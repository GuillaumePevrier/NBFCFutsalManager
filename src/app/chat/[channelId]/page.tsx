
'use client';

import { getMessages, sendMessage, getChannels } from '@/app/actions';
import Header from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Message, Channel, Player } from '@/lib/types';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useFormStatus } from 'react-dom';

function SendButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" size="icon" disabled={pending}>
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
    )
}

export default function ChannelPage() {
    const { channelId } = useParams() as { channelId: string };
    const [channel, setChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
      scrollToBottom();
    }, [messages]);


    useEffect(() => {
        const fetchChannelAndMessages = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setCurrentUserId(user.id);
            
            const allChannels = await getChannels();
            const currentChannel = allChannels.find(c => c.id === channelId);
            
            if (!currentChannel) {
                toast({ title: "Accès refusé", description: "Vous ne faites pas partie de cette conversation.", variant: "destructive"});
                router.push('/chat');
                return;
            }

            setChannel(currentChannel);
            const messageData = await getMessages(channelId);
            setMessages(messageData);
            setLoading(false);
        };

        fetchChannelAndMessages();

        const messageListener = supabase
            .channel(`messages-in-${channelId}`)
            .on<Message>(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
                async (payload) => {
                    // Manually fetch sender info for the new message
                    const { data: player } = await supabase.from('players').select('id, name, avatar_url').eq('user_id', payload.new.user_id).single();
                    setMessages(currentMessages => [...currentMessages, {...payload.new, sender: player || undefined }]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageListener);
        }

    }, [channelId, router, supabase, toast]);

    const handleSendMessage = async (formData: FormData) => {
        const content = formData.get('content') as string;
        if (!content.trim()) return;

        // Reset form immediately for better UX
        const form = document.getElementById('send-message-form') as HTMLFormElement;
        form.reset();

        const { error } = await sendMessage(channelId, content);

        if (error) {
            toast({
                title: "Erreur d'envoi",
                description: "Votre message n'a pas pu être envoyé.",
                variant: 'destructive',
            });
            // Restore content on error
            (form.elements.namedItem('content') as HTMLInputElement).value = content;
        }
    };
    
    const getChannelName = () => {
        if (!channel) return 'Chargement...';
        if (channel.type === 'group') return channel.name || 'Groupe';
        const otherUser = channel.participants?.find(p => p.user_id !== currentUserId);
        return otherUser?.name || 'Discussion';
    }


    if (loading) {
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
                <div className="flex-grow flex items-center justify-center main-bg">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-muted/40">
            <Header>
                <div className="flex items-center gap-2 overflow-hidden">
                    <Button asChild variant="ghost" size="icon" className="flex-shrink-0">
                       <Link href="/chat">
                         <ArrowLeft className="h-5 w-5" />
                       </Link>
                    </Button>
                    <span className="font-bold text-lg truncate">{getChannelName()}</span>
                </div>
            </Header>
            <main className="flex-grow flex flex-col p-4 overflow-y-auto">
                <div className="flex-grow space-y-4">
                   {messages.map(message => {
                       const isSender = message.user_id === currentUserId;
                       return (
                           <div key={message.id} className={cn("flex items-end gap-2", isSender ? 'justify-end' : 'justify-start')}>
                                {!isSender && (
                                   <Avatar className="h-8 w-8">
                                       <AvatarImage src={message.sender?.avatar_url} />
                                       <AvatarFallback>{getInitials(message.sender?.name)}</AvatarFallback>
                                   </Avatar>
                                )}
                                <div className={cn(
                                    "p-3 rounded-2xl max-w-sm md:max-w-md",
                                    isSender 
                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                        : "bg-card text-card-foreground rounded-bl-none"
                                )}>
                                    <p className="text-sm">{message.content}</p>
                                </div>
                           </div>
                       )
                   })}
                   <div ref={messagesEndRef} />
                </div>
            </main>
            <footer className="p-4 bg-background border-t">
                <form id="send-message-form" action={handleSendMessage} className="flex items-center gap-2">
                    <Input name="content" placeholder="Écrivez un message..." autoComplete="off" />
                    <SendButton />
                </form>
            </footer>
        </div>
    );
}
