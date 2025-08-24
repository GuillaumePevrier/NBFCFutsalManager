
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and Anon Key are required. Check your .env.local file.");
    // Retourner null ou un objet client non fonctionnel pour éviter le crash.
    // L'application ne plantera plus, mais les fonctionnalités Supabase ne marcheront pas
    // jusqu'à ce que les clés soient configurées.
    return null;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
