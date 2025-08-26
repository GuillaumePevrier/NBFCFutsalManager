
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and Anon Key are required. Check your .env file or Vercel environment variables.");
    // Return a non-functional object to prevent crashes, but functionality will be limited.
    // This provides a graceful degradation instead of a hard crash.
    return null;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
