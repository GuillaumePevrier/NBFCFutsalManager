
import { PlayerForm } from "../player-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewPlayerPage() {
    const supabase = createClient();
    const { data: { session }} = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }
    
    return <PlayerForm />;
}
