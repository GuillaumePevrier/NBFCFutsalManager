
'use server';

import { createClient } from '@/lib/supabase/server';
import type { Match } from '@/lib/types';

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
