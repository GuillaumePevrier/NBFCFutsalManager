
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

export async function getPlayerById(playerId: string): Promise<Player | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
      
    if (error) {
        console.error(`Failed to fetch player ${playerId}:`, error);
        return null;
    }
    return data;
}


export async function updatePlayerStats({ playerId, goals, fouls }: { playerId: string, goals?: number, fouls?: number }): Promise<{ success: boolean }> {
    const supabase = createClient();
    
    // 1. Récupérer les stats actuelles du joueur
    const { data: currentPlayer, error: fetchError } = await supabase
      .from('players')
      .select('goals, fouls')
      .eq('id', playerId)
      .single();
    
    if (fetchError) {
      console.error(`Could not fetch player ${playerId} for stats update`, fetchError);
      return { success: false };
    }

    // 2. Préparer les nouvelles valeurs
    const newGoals = (currentPlayer.goals || 0) + (goals || 0);
    const newFouls = (currentPlayer.fouls || 0) + (fouls || 0);

    // 3. Mettre à jour la base de données
    const { error: updateError } = await supabase
      .from('players')
      .update({
        goals: newGoals,
        fouls: newFouls,
      })
      .eq('id', playerId);

    if (updateError) {
      console.error(`Failed to update stats for player ${playerId}`, updateError);
      return { success: false };
    }
    
    // Revalider les chemins où les stats pourraient être affichées
    revalidatePath(`/player/${playerId}`);
    revalidatePath(`/match/*`); // Revalide toutes les pages de match

    return { success: true };
}
