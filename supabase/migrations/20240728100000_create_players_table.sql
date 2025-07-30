-- Create the players table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text,
    age integer,
    avatar_url text,
    team text, -- Keeping as text for flexibility: 'D1', 'D2', 'Autre'
    position text, -- 'Goalkeeper', 'Defender', 'Winger', 'Pivot'
    preferred_foot text, -- 'Right', 'Left', 'Both'
    goals integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL,
    CONSTRAINT players_name_key UNIQUE (name)
);

-- Add columns only if they don't exist
-- This is useful if the table was created but is missing columns
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'goals') THEN
        ALTER TABLE public.players ADD COLUMN goals integer DEFAULT 0 NOT NULL;
    END IF;
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'players' AND column_name = 'fouls') THEN
        ALTER TABLE public.players ADD COLUMN fouls integer DEFAULT 0 NOT NULL;
    END IF;
END;
$$;


-- Enable Row Level Security on the table if not already enabled
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Players are viewable by everyone." ON public.players;
DROP POLICY IF EXISTS "Coaches can insert new players." ON public.players;
DROP POLICY IF EXISTS "Coaches can update player stats and info." ON public.players;
DROP POLICY IF EXISTS "Coaches can delete players." ON public.players;

-- Create policies for data access
CREATE POLICY "Players are viewable by everyone." ON public.players
    FOR SELECT USING (true);

CREATE POLICY "Coaches can insert new players." ON public.players
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Coaches can update player stats and info." ON public.players
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Coaches can delete players." ON public.players
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert players only if they don't already exist (based on the unique name)
-- This prevents duplication errors if the script is run multiple times
INSERT INTO public.players (name, team, position, preferred_foot)
VALUES
    ('Guillaume PEVRIER', 'D1', 'Winger', 'Right'),
    ('Fabien R.', 'D1', 'Defender', 'Right'),
    ('Coach Seb', 'D1', 'Pivot', 'Right'),
    ('Antoine B.', 'D1', 'Goalkeeper', 'Right'),
    ('Pierre G.', 'D1', 'Winger', 'Left'),
    ('Bastien L.', 'D2', 'Defender', 'Right'),
    ('Kevin R.', 'D2', 'Pivot', 'Right'),
    ('Yoann L.', 'D2', 'Winger', 'Right'),
    ('Gireg L.', 'D2', 'Defender', 'Right'),
    ('Ronan B', 'D2', 'Goalkeeper', 'Right')
ON CONFLICT (name) DO NOTHING;
