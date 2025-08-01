
import { getPlayerById } from "@/app/actions";
import { notFound, redirect } from "next/navigation";
import { PlayerForm } from "../../player-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditPlayerPage({ params }: { params: { playerId: string }}) {
    const supabase = createClient();
    const { data: { session }} = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }

    const player = await getPlayerById(params.playerId);
    if (!player) {
        notFound();
    }

    return <PlayerForm player={player} />;
}
