'use server';

import { createClient } from '@/lib/supabase/server';
import type { Player } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Match related actions (no changes)

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
    revalidatePath('/match');

    return { success: true };
}


// Player related actions

const PlayerSchema = z.object({
  id: z.string().optional(), // id can be present for updates
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  team: z.enum(['D1', 'D2', 'Autre']),
  position: z.enum(['Gardien', 'Défenseur', 'Ailier', 'Pivot', '']).optional(),
  preferred_foot: z.enum(['Droit', 'Gauche', 'Ambidextre', '']).optional(),
  avatar_url: z.string().url("L'URL de l'avatar n'est pas valide.").optional().or(z.literal('')),
});


export async function getPlayers(): Promise<Player[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true });
    
  if (error) {
    console.error("Failed to fetch players:", error);
    return [];
  }
  return data as Player[];
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

export async function createPlayer(previousState: any, formData: FormData) {
  const supabase = createClient();
  const values = Object.fromEntries(formData.entries());
  const validatedFields = PlayerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { id, ...playerData } = validatedFields.data;

  const { data, error } = await supabase
    .from('players')
    .insert([playerData])
    .select();

  if (error) {
    console.error("Failed to create player:", error);
    return {
      error: error.message
    };
  }

  revalidatePath('/admin/players');
  revalidatePath('/');
  return { data };
}

export async function updatePlayer(previousState: any, formData: FormData) {
  const supabase = createClient();
  const values = Object.fromEntries(formData.entries());
  const validatedFields = PlayerSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id: playerId, ...playerData } = validatedFields.data;

  if (!playerId) {
    return { error: "Player ID is missing for update." };
  }

  const { data, error } = await supabase
    .from('players')
    .update(playerData)
    .eq('id', playerId)
    .select();

  if (error) {
     console.error(`Failed to update player ${playerId}:`, error);
    return {
      error: error.message
    };
  }

  revalidatePath('/admin/players');
  revalidatePath(`/player/${playerId}`);
  return { data };
}


export async function deletePlayer(playerId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

    if (error) {
        console.error(`Failed to delete player ${playerId}:`, error);
        return { error: error.message };
    }

    revalidatePath('/admin/players');
    revalidatePath('/');
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
    revalidatePath('/admin/players');

    return { success: true };
}
