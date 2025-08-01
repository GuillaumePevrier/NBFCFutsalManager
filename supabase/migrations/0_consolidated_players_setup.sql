-- supabase/migrations/0_consolidated_players_setup.sql

-- 1. Create the players table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    email text,
    age integer,
    avatar_url text,
    team text,
    "position" text,
    preferred_foot text,
    goals integer DEFAULT 0,
    fouls integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Make sure RLS is enabled
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Remove old policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to read players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users (coaches) to do everything" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to insert players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to update players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to delete players" ON public.players;


-- 2. Define Row Level Security (RLS) policies
-- Policy: Allow all users (public) to read player data
CREATE POLICY "Allow all users to read players"
ON public.players
FOR SELECT
USING (true);

-- Policy: Allow authenticated users (coaches) to insert, update, and delete players
CREATE POLICY "Allow authenticated users (coaches) to do everything"
ON public.players
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- 3. Add CHECK constraints for specific columns, now with French values
-- Drop old constraints if they exist
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_position_check;
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_preferred_foot_check;
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_team_check;

-- Add new constraints with French vocabulary
ALTER TABLE public.players ADD CONSTRAINT players_position_check
CHECK (("position" = ANY (ARRAY['Gardien'::text, 'Défenseur'::text, 'Ailier'::text, 'Pivot'::text, ''::text, NULL])));

ALTER TABLE public.players ADD CONSTRAINT players_preferred_foot_check
CHECK ((preferred_foot = ANY (ARRAY['Droit'::text, 'Gauche'::text, 'Ambidextre'::text, ''::text, NULL])));

ALTER TABLE public.players ADD CONSTRAINT players_team_check
CHECK ((team = ANY (ARRAY['D1'::text, 'D2'::text, 'Autre'::text])));


-- 4. Clean up duplicates
-- This command will keep the first created record for each player with the same name and delete the others.
DELETE FROM public.players
WHERE id NOT IN (
  SELECT MIN(id)
  FROM public.players
  GROUP BY name
);

-- 5. Add a UNIQUE constraint on the name to prevent future duplicates
ALTER TABLE public.players
ADD CONSTRAINT players_name_unique UNIQUE (name);

-- Reset sequence for IDs if needed (though UUIDs don't strictly need it, it's good practice for other types)
-- This step is generally not required for UUIDs but is included for completeness.
-- No action needed for UUID primary keys.

-- Grant usage permissions to the public schema and the players table
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.players TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE players_id_seq TO postgres, anon, authenticated, service_role; -- If you were using SERIAL instead of UUID
