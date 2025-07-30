
'use server';

import { createClient } from '@/lib/supabase/server';
import type { Match } from '@/lib/types';
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

    // Revalidate the home page to reflect the changes
    revalidatePath('/');

    return { success: true };
}
