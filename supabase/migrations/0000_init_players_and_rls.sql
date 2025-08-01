-- Ce script est idempotent, il peut être exécuté plusieurs fois sans erreur.

-- 1. Créer la table "players" si elle n'existe pas.
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    team text DEFAULT 'D1'::text,
    position text,
    preferred_foot text,
    avatar_url text,
    goals integer DEFAULT 0,
    fouls integer DEFAULT 0
);

-- 2. Rendre la colonne 'name' unique pour éviter les doublons.
--    On vérifie d'abord si la contrainte existe avant de l'ajouter.
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT constraint_name FROM information_schema.table_constraints
       WHERE table_name = 'players' AND constraint_type = 'UNIQUE' AND constraint_name = 'players_name_key'
   ) THEN
       ALTER TABLE public.players ADD CONSTRAINT players_name_key UNIQUE (name);
   END IF;
END;
$$;


-- 3. Activer la Sécurité au Niveau des Lignes (Row Level Security).
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques de sécurité pour éviter les conflits.
DROP POLICY IF EXISTS "Allow all users to read players" ON public.players;
DROP POLICY IF EXISTS "Allow authenticated users to manage players" ON public.players;
DROP POLICY IF EXISTS "Allow all users to view players" ON public.players;
DROP POLICY IF EXISTS "Allow coaches to manage players" ON public.players;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.players;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.players;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.players;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.players;


-- 5. Créer les nouvelles politiques de sécurité.
--    Politique 1 : Tout le monde (visiteurs inclus) peut voir la liste des joueurs et leurs fiches.
CREATE POLICY "Allow all users to read players" ON public.players
AS PERMISSIVE FOR SELECT
TO public
USING (true);

--    Politique 2 : Seuls les coachs (utilisateurs authentifiés) peuvent créer, modifier et supprimer des joueurs.
CREATE POLICY "Allow authenticated users to manage players" ON public.players
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Insérer la liste de départ des joueurs, en ignorant les doublons si un nom existe déjà.
--    Ceci est utile pour le premier remplissage.
INSERT INTO public.players (name, team, position, preferred_foot) VALUES
('Guillaume Pevrier', 'D1', 'Winger', 'Right'),
('Matthieu Pevrier', 'D1', 'Defender', 'Right'),
('Clément Bouvier', 'D1', 'Pivot', 'Right'),
('Antoine Delaunay', 'D1', 'Winger', 'Right'),
('Romain Huet', 'D1', 'Goalkeeper', 'Right'),
('Florian Lebreton', 'D2', 'Defender', 'Left'),
('Kevin Genissel', 'D2', 'Winger', 'Right'),
('Yoann Doualan', 'D2', 'Pivot', 'Right')
ON CONFLICT (name) DO NOTHING;
