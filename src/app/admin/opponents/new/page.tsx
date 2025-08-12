
import { OpponentForm } from "../opponent-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewOpponentPage() {
    const supabase = createClient();
    const { data: { session }} = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }
    
    return <OpponentForm />;
}
