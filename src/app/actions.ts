'use server';

import { createClient } from '@/lib/supabase/server';
import type { Player, Opponent } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Match related actions

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
  player_number: z.coerce.number().optional(),
  status: z.enum(['Actif', 'Blessé', 'Suspendu', 'Inactif']).optional(),
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


// Opponent related actions

const OpponentSchema = z.object({
  id: z.string().optional(),
  team_name: z.string().min(3, "Le nom de l'équipe doit contenir au moins 3 caractères."),
  club_name: z.string().optional(),
  logo_url: z.string().url("L'URL du logo n'est pas valide.").optional().or(z.literal('')),
  championship: z.string().optional(),
  coach_name: z.string().optional(),
  coach_email: z.string().email("L'email du coach n'est pas valide.").optional().or(z.literal('')),
  coach_phone: z.string().optional(),
  address: z.string().optional(),
});


export async function getOpponents(): Promise<Opponent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('opponents')
    .select('*')
    .order('team_name', { ascending: true });
    
  if (error) {
    console.error("Failed to fetch opponents:", error);
    return [];
  }
  return data as Opponent[];
}

export async function getOpponentById(opponentId: string): Promise<Opponent | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('opponents')
      .select('*')
      .eq('id', opponentId)
      .single();
      
    if (error) {
        console.error(`Failed to fetch opponent ${opponentId}:`, error);
        return null;
    }
    return data;
}

export async function createOpponent(previousState: any, formData: FormData) {
  const supabase = createClient();
  const values = Object.fromEntries(formData.entries());
  const validatedFields = OpponentSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { id, ...opponentData } = validatedFields.data;

  const { data, error } = await supabase
    .from('opponents')
    .insert([opponentData])
    .select();

  if (error) {
    console.error("Failed to create opponent:", error);
    return {
      error: error.message
    };
  }

  revalidatePath('/admin/opponents');
  return { data };
}


export async function updateOpponent(previousState: any, formData: FormData) {
  const supabase = createClient();
  const values = Object.fromEntries(formData.entries());
  const validatedFields = OpponentSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id: opponentId, ...opponentData } = validatedFields.data;

  if (!opponentId) {
    return { error: "Opponent ID is missing for update." };
  }

  const { data, error } = await supabase
    .from('opponents')
    .update(opponentData)
    .eq('id', opponentId)
    .select();

  if (error) {
     console.error(`Failed to update opponent ${opponentId}:`, error);
    return {
      error: error.message
    };
  }

  revalidatePath('/admin/opponents');
  revalidatePath(`/opponent/${opponentId}`);
  return { data };
}


export async function deleteOpponent(opponentId: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from('opponents')
        .delete()
        .eq('id', opponentId);

    if (error) {
        console.error(`Failed to delete opponent ${opponentId}:`, error);
        return { error: error.message };
    }

    revalidatePath('/admin/opponents');
}
