
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client standard pour les opérations côté serveur avec les droits de l'utilisateur
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    "https://vehbxkqndoqmqwtjbcjr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaGJ4a3FuZG9xbXF3dGpiY2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTYzNzcsImV4cCI6MjA2OTEzMjM3N30.Egrs2V0fmAJnZcpcLaHtQ3iTmBEEVU8rBLmc8qZgI6g",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}


// Client privilégié pour les opérations d'administration (création/suppression d'utilisateurs)
// qui nécessitent la clé de service role.
export function createAdminClient() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
    }

    return createServerClient(
        "https://vehbxkqndoqmqwtjbcjr.supabase.co",
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

