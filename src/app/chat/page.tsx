
import { getChannels } from "@/app/actions";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { MessageSquarePlus } from "lucide-react";

export default async function ChatPage() {
    const supabase = createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        redirect('/');
    }
    
    const channels = await getChannels();

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
                   {channels.length > 0 ? (
                       <ul>
                           {channels.map(channel => (
                               <li key={channel.id} className="p-2 hover:bg-muted rounded-md">
                                   <Link href={`/chat/${channel.id}`}>
                                     {channel.name || `Discussion privée ${channel.id.substring(0,6)}`}
                                   </Link>
                               </li>
                           ))}
                       </ul>
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
