-- ===============================================================================================
-- CONSOLIDATED PLAYER MANAGEMENT SCRIPT
-- ===============================================================================================
-- This single script handles the complete setup for the 'players' table.
-- It is idempotent, meaning it can be run multiple times without causing errors.
--
-- It includes:
-- 1. Table Creation ('players')
-- 2. Column additions ('goals', 'fouls')
-- 3. Row Level Security (RLS) Policies for read, insert, update, delete.
-- 4. Data Cleanup (removes duplicates).
-- ===============================================================================================

-- Step 1: Create the players table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    team text,
    "position" text,
    preferred_foot text,
    avatar_url text
);

-- Step 2: Add statistics columns if they don't exist
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS goals integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS fouls integer DEFAULT 0 NOT NULL;

-- Step 3: Ensure the 'name' column is unique to prevent duplicates
-- This is crucial for the ON CONFLICT clause to work during inserts.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.players'::regclass 
        AND conname = 'players_name_key'
    ) THEN
        ALTER TABLE public.players ADD CONSTRAINT players_name_key UNIQUE (name);
    END IF;
END$$;


-- Step 4: Clean up duplicate players by name, keeping the first one created.
DELETE FROM players a
USING players b
WHERE
    a.id > b.id
    AND a.name = b.name;

-- Step 5: Enable Row Level Security on the table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies to avoid conflicts and ensure a clean slate
DROP POLICY IF EXISTS "Players are viewable by everyone." ON public.players;
DROP POLICY IF EXISTS "Users can insert their own players." ON public.players;
DROP POLICY IF EXISTS "Users can update their own players." ON public.players;
DROP POLICY IF EXISTS "Users can delete their own players." ON public.players;
DROP POLICY IF EXISTS "Authenticated users can manage players" ON public.players;
DROP POLICY IF EXISTS "Allow public read access to players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to manage players" ON public.players;


-- Step 7: Create the new, correct policies
-- Policy 1: Allow anyone to read player data (for stats, public profiles, etc.)
CREATE POLICY "Allow public read access to players"
ON public.players
FOR SELECT
TO public
USING (true);

-- Policy 2: Allow ONLY authenticated users (coaches) to do everything else (create, update, delete)
CREATE POLICY "Allow authenticated users to manage players"
ON public.players
FOR ALL -- Covers INSERT, UPDATE, DELETE
TO authenticated
USING (true)
WITH CHECK (true);

-- ===============================================================================================
-- End of Script
-- ===============================================================================================
