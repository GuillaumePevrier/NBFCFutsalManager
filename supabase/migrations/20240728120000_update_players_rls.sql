-- This script updates the players table and its security policies.
-- It ensures coaches can fully manage players (CREATE, READ, UPDATE, DELETE).

-- 1. Ensure the 'players' table exists with all necessary columns.
-- Using "create table if not exists" to avoid errors on re-runs.
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text,
    age integer,
    avatar_url text,
    team text DEFAULT 'D1'::text,
    "position" text,
    preferred_foot text,
    goals integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL
);

-- Make sure the table is owned by the authenticated role
ALTER TABLE public.players OWNER TO authenticated;

-- 2. Add a UNIQUE constraint on the 'name' column if it doesn't exist.
-- This is crucial for preventing duplicate players.
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'players_name_key' AND conrelid = 'public.players'::regclass
   ) THEN
       ALTER TABLE public.players ADD CONSTRAINT players_name_key UNIQUE (name);
   END IF;
END$$;


-- 3. Enable Row Level Security (RLS) on the table if not already enabled.
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts and ensure a clean slate.
DROP POLICY IF EXISTS "Allow all users to read players" ON public.players;
DROP POLICY IF EXISTS "Allow coach to update players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to manage players" ON public.players;

-- 5. Create the definitive policies for player management.

-- POLICY 1: Everyone can see the players' data.
-- This is necessary for player profile pages to be visible to non-coaches.
CREATE POLICY "Allow all users to read players"
ON public.players FOR SELECT
USING (true);

-- POLICY 2: Authenticated users (coaches) can do everything.
-- This gives them full control to add, update, and delete players.
CREATE POLICY "Allow authenticated users to manage players"
ON public.players FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

GRANT ALL ON TABLE public.players TO authenticated;
GRANT SELECT ON TABLE public.players TO anon, service_role;
