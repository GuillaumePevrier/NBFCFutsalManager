-- Ce script est idempotent, il peut être exécuté plusieurs fois sans causer d'erreurs.
-- Il configure la table des joueurs, nettoie les doublons et définit les politiques de sécurité.

-- 1. Créer la table "players" si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.players (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    team text,
    "position" text,
    preferred_foot text,
    avatar_url text,
    goals integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL
);

-- Ajouter des commentaires sur les colonnes pour plus de clarté
COMMENT ON TABLE public.players IS 'Table contenant les informations sur les joueurs de l''effectif.';
COMMENT ON COLUMN public.players.goals IS 'Nombre total de buts marqués par le joueur toutes saisons confondues.';
COMMENT ON COLUMN public.players.fouls IS 'Nombre total de fautes commises par le joueur toutes saisons confondues.';


-- 2. Ajouter une contrainte UNIQUE sur le nom du joueur si elle n'existe pas
-- Cela est crucial pour éviter les doublons et pour la commande ON CONFLICT.
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 FROM pg_constraint 
       WHERE conname = 'players_name_key' AND conrelid = 'public.players'::regclass
   ) THEN
       ALTER TABLE public.players ADD CONSTRAINT players_name_key UNIQUE (name);
   END IF;
END$$;


-- 3. Nettoyer les doublons en gardant le premier joueur créé
DELETE FROM players a USING players b
WHERE
    a.id < b.id
    AND a.name = b.name;

-- 4. Activer la Sécurité au Niveau de la Ligne (RLS) sur la table
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques de sécurité (supprime les anciennes pour éviter les conflits)
-- Politique pour la LECTURE : tout le monde peut voir les joueurs.
DROP POLICY IF EXISTS "Public can view players" ON public.players;
CREATE POLICY "Public can view players" ON public.players
    FOR SELECT USING (true);

-- Politique pour la GESTION (INSERT, UPDATE, DELETE) : seuls les utilisateurs authentifiés (coachs) peuvent gérer l'effectif.
DROP POLICY IF EXISTS "Authenticated users can manage players" ON public.players;
CREATE POLICY "Authenticated users can manage players" ON public.players
    FOR ALL -- S'applique à INSERT, UPDATE, DELETE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Assurer que le propriétaire de la table peut tout faire
ALTER TABLE public.players OWNER TO postgres;

-- Créer la table des adversaires pour une utilisation future
CREATE TABLE IF NOT EXISTS public.opponents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    logo_url text
);

ALTER TABLE public.opponents ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.opponents IS 'Table pour stocker les informations sur les équipes adverses.';

-- Politique pour la LECTURE : tout le monde peut voir les adversaires.
DROP POLICY IF EXISTS "Public can view opponents" ON public.opponents;
CREATE POLICY "Public can view opponents" ON public.opponents
    FOR SELECT USING (true);

-- Politique pour la GESTION : seuls les coachs peuvent gérer les adversaires.
DROP POLICY IF EXISTS "Authenticated users can manage opponents" ON public.opponents;
CREATE POLICY "Authenticated users can manage opponents" ON public.opponents
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
