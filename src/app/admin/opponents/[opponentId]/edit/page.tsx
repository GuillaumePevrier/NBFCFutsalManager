
import { getOpponentById } from "@/app/actions";
import { notFound, redirect } from "next/navigation";
import { OpponentForm } from "../../opponent-form";
import { createClient } from "@/lib/supabase/server";

export default async function EditOpponentPage({ params }: { params: { opponentId: string }}) {
    const supabase = createClient();
    const { data: { session }} = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }

    const opponent = await getOpponentById(params.opponentId);
    if (!opponent) {
        notFound();
    }

    return <OpponentForm opponent={opponent} />;
}
