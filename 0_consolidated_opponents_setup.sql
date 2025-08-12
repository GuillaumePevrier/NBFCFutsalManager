-- =================================================================
-- 1. CLEANUP: Drop the old "opponents" table if it exists
-- This ensures we start with aa clean slate.
-- =================================================================
DROP TABLE IF EXISTS public.opponents;


-- =================================================================
-- 2. CREATE TABLE: The new, detailed "opponents" table
-- This table will store all information about the teams you play against.
-- =================================================================
CREATE TABLE public.opponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Core Team Information
    team_name text NOT NULL, -- e.g., "US Janzé"
    club_name text,          -- e.g., "Union Sportive de Janzé", can be the same as team_name
    logo_url text,           -- URL for the team's logo, for display on cards

    -- Competition & Ranking Information
    championship text,       -- e.g., "District 1, Poule B", "Coupe de France"
    
    -- Contact & Location
    address text,            -- Address of the team's home venue
    coach_name text,
    coach_email text,
    coach_phone text,

    -- Future-proofing columns for stats/ranking
    -- These can be updated via server-side logic after matches
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    draws integer DEFAULT 0,
    goals_for integer DEFAULT 0,
    goals_against integer DEFAULT 0
);

-- Add comments to explain each column's purpose
COMMENT ON COLUMN public.opponents.team_name IS 'The official name of the opponent team.';
COMMENT ON COLUMN public.opponents.club_name IS 'The full name of the club, if different from the team name.';
COMMENT ON COLUMN public.opponents.logo_url IS 'A public URL to the team or club logo.';
COMMENT ON COLUMN public.opponents.championship IS 'The name of the league or competition the team plays in.';
COMMENT ON COLUMN public.opponents.address IS 'The primary address or home venue of the opponent.';
COMMENT ON COLUMN public.opponents.coach_name IS 'Full name of the team''s main contact or coach.';
COMMENT ON COLUMN public.opponents.coach_email IS 'Contact email for the coach.';
COMMENT ON COLUMN public.opponents.coach_phone IS 'Contact phone number for the coach.';
COMMENT ON COLUMN public.opponents.wins IS 'Total wins against this opponent (for head-to-head stats).';
COMMENT ON COLUMN public.opponents.losses IS 'Total losses against this opponent.';
COMMENT ON COLUMN public.opponents.draws IS 'Total draws against this opponent.';
COMMENT ON COLUMN public.opponents.goals_for IS 'Total goals scored against this opponent.';
COMMENT ON COLUMN public.opponents.goals_against IS 'Total goals conceded against this opponent.';


-- =================================================================
-- 3. ENABLING ROW LEVEL SECURITY (RLS)
-- This is a crucial security step.
-- =================================================================
ALTER TABLE public.opponents ENABLE ROW LEVEL SECURITY;


-- =================================================================
-- 4. RLS POLICIES: Define who can do what
-- We want everyone to be able to see the opponents, but only authenticated
-- users (coaches) to be able to modify them.
-- =================================================================

-- POLICY 1: Allow public read access to everyone.
-- Any visitor, logged in or not, can view the list of opponents.
CREATE POLICY "Allow public read access to opponents"
ON public.opponents
FOR SELECT
USING (true);

-- POLICY 2: Allow authenticated users (coaches) full access.
-- This allows users who are logged in (i.e., have a 'coach' role in our app)
-- to insert, update, and delete opponents.
CREATE POLICY "Allow full access for authenticated users"
ON public.opponents
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- =================================================================
-- Script End. You can now manage opponents in your application.
-- =================================================================
