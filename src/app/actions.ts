
'use server';

import { createClient } from '@/lib/supabase/server';
import type { Match, Player } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getMatches(): Promise<Match[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
  
  return data as Match[];
}

export async function deleteMatch(matchId: string): Promise<{ success: boolean, error?: any }> {
    const supabase = createClient();
    
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

    if (error) {
        console.error("Failed to delete match:", error);
        return { success: false, error };
    }

    revalidatePath('/');

    return { success: true };
}


// IMPORTANT: This is a placeholder. In a real app, you would fetch from a 'players' table.
const allPlayers: Player[] = [
    { id: '1', name: 'Hugo Lloris', team: 'D1', position: 'Goalkeeper', goals: 0, fouls: 0 },
    { id: '2', name: 'Benjamin Pavard', team: 'D1', position: 'Defender', goals: 2, fouls: 3 },
    { id: '3', name: 'Raphaël Varane', team: 'D1', position: 'Defender', goals: 1, fouls: 1 },
    { id: '4', name: 'Presnel Kimpembe', team: 'D1', position: 'Defender', goals: 0, fouls: 5 },
    { id: '5', name: 'Lucas Hernandez', team: 'D1', position: 'Defender', goals: 1, fouls: 2 },
    { id: '6', name: 'Paul Pogba', team: 'D1', position: 'Winger', goals: 5, fouls: 1 },
    { id: '7', name: 'Antoine Griezmann', team: 'D1', position: 'Pivot', goals: 12, fouls: 2 },
    { id: '8', name: "N'Golo Kanté", team: 'D1', position: 'Winger', goals: 3, fouls: 0 },
    { id: '9', name: 'Olivier Giroud', team: 'D1', position: 'Pivot', goals: 15, fouls: 4 },
    { id: '10', name: 'Kylian Mbappé', team: 'D1', position: 'Pivot', goals: 22, fouls: 3 },
    { id: '11', name: 'Ousmane Dembélé', team: 'D2', position: 'Winger', goals: 8, fouls: 6 },
    { id: '12', name: 'Corentin Tolisso', team: 'D2', position: 'Winger', goals: 4, fouls: 1 },
];

export async function getPlayerById(playerId: string): Promise<Player | null> {
    // In a real app, fetch from Supabase `players` table
    // const supabase = createClient();
    // const { data, error } = await supabase.from('players').select('*').eq('id', playerId).single();
    // if (error) return null;
    // return data;
    
    const player = allPlayers.find(p => p.id === playerId);
    return player || null;
}


export async function updatePlayerStats({ playerId, goals, fouls }: { playerId: string, goals?: number, fouls?: number }): Promise<{ success: boolean }> {
    // This is a placeholder for updating player stats in a real database.
    // In a real app, you would perform an update query on your 'players' table.
    // For example:
    // const supabase = createClient();
    // const { data: currentPlayer, error: fetchError } = await supabase
    //   .from('players')
    //   .select('goals, fouls')
    //   .eq('id', playerId)
    //   .single();
    //
    // if (fetchError) { ... handle error ... }
    //
    // const { error: updateError } = await supabase
    //   .from('players')
    //   .update({
    //     goals: currentPlayer.goals + (goals || 0),
    //     fouls: currentPlayer.fouls + (fouls || 0),
    //   })
    //   .eq('id', playerId);
    //
    // if (updateError) return { success: false };
    
    console.log(`Updating stats for player ${playerId}: add ${goals} goals, ${fouls} fouls.`);
    const playerIndex = allPlayers.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        if(goals) allPlayers[playerIndex].goals += goals;
        if(fouls) allPlayers[playerIndex].fouls += fouls;
    }
    
    revalidatePath(`/player/${playerId}`);
    revalidatePath(`/match/*`);

    return { success: true };
}
