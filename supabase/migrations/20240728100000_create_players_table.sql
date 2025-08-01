
-- Drop existing policies on players table to avoid conflicts
DROP POLICY IF EXISTS "Public can view players" ON public.players;
DROP POLICY IF EXISTS "Coach can update players" ON public.players;

-- Ensure players table exists
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text,
    age integer,
    avatar_url text,
    team text CHECK (team IN ('D1', 'D2', 'Autre')),
    position text CHECK (position IN ('Goalkeeper', 'Defender', 'Winger', 'Pivot')),
    preferred_foot text CHECK (preferred_foot IN ('Right', 'Left', 'Both')),
    goals integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL
);

-- Add a primary key if it doesn't exist
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conrelid = 'public.players'::regclass 
       AND conname = 'players_pkey'
   ) THEN
       ALTER TABLE public.players ADD PRIMARY KEY (id);
   END IF;
END
$$;

-- Add a unique constraint on the name column if it doesn't exist
-- This is crucial for ON CONFLICT to work and for cleaning up duplicates
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conrelid = 'public.players'::regclass 
       AND conname = 'players_name_key'
   ) THEN
       ALTER TABLE public.players ADD CONSTRAINT players_name_key UNIQUE (name);
   END IF;
END
$$;

-- Clean up duplicate players based on name, keeping the one with the most goals
-- This is a safe way to remove duplicates without losing important data.
WITH ranked_players AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY goals DESC, created_at DESC) as rn
  FROM public.players
)
DELETE FROM public.players
WHERE id IN (
  SELECT id FROM ranked_players WHERE rn > 1
);


-- Insert initial players only if they don't already exist
-- ON CONFLICT(name) DO NOTHING prevents errors if a player with the same name already exists.
INSERT INTO public.players (name, team, position, preferred_foot)
VALUES
    ('Guillaume Pevrier', 'D1', 'Winger', 'Right'),
    ('Alexandre Plihon', 'D1', 'Winger', 'Right'),
    ('Yoann Plihon', 'D1', 'Pivot', 'Right'),
    ('Clément Plihon', 'D1', 'Defender', 'Right'),
    ('Mael Pevrier', 'D1', 'Defender', 'Right'),
    ('Simon Pevrier', 'D1', 'Goalkeeper', 'Right'),
    ('Nolann Pevrier', 'D1', 'Winger', 'Right'),
    ('Thomas Chevalier', 'D2', 'Pivot', 'Left'),
    ('Romain Duval', 'D2', 'Defender', 'Right'),
    ('Antoine Lemoine', 'D2', 'Goalkeeper', 'Right')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security on the players table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create a new, simple policy: Anyone can read players' data.
-- This will fix the issue of player pages not showing up for non-coaches.
CREATE POLICY "Public can view players" ON public.players
    FOR SELECT
    USING (true);

-- Create a new policy: Only authenticated users (coaches) can update players.
-- This secures your data while allowing public visibility.
CREATE POLICY "Coach can update players" ON public.players
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
