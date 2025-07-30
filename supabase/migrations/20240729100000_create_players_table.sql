-- supabase/migrations/YYYYMMDDHHMMSS_create_players_table.sql

-- 1. Création de la table pour stocker les joueurs
CREATE TABLE public.players (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    email text,
    age integer,
    avatar_url text,
    team text NOT NULL CHECK (team IN ('D1', 'D2', 'Autre')),
    "position" text CHECK ("position" IN ('Goalkeeper', 'Defender', 'Winger', 'Pivot')),
    preferred_foot text CHECK (preferred_foot IN ('Right', 'Left', 'Both')),
    goals integer NOT NULL DEFAULT 0,
    fouls integer NOT NULL DEFAULT 0,
    CONSTRAINT players_pkey PRIMARY KEY (id),
    CONSTRAINT players_email_key UNIQUE (email)
);

-- Commentaire sur la table pour la documentation
COMMENT ON TABLE public.players IS 'Table contenant les informations et statistiques des joueurs du club.';

-- 2. Activation de la sécurité au niveau des lignes (Row Level Security)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 3. Définition des politiques de sécurité
-- Politique 1: Tout le monde peut voir les joueurs
CREATE POLICY "Allow public read access to players"
ON public.players
FOR SELECT
USING (true);

-- Politique 2: Seuls les utilisateurs authentifiés (coachs) peuvent insérer, mettre à jour ou supprimer des joueurs.
-- Note: 'authenticated' est un rôle spécial dans Supabase.
CREATE POLICY "Allow authenticated users to manage players"
ON public.players
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- 4. Insertion des joueurs de base (ceux qui étaient en dur dans le code)
-- Cela vous donne un point de départ. Vous pourrez les modifier ou en ajouter d'autres plus tard.
INSERT INTO public.players (id, name, team, "position", goals, fouls) VALUES
    ('1', 'Hugo Lloris', 'D1', 'Goalkeeper', 0, 0),
    ('2', 'Benjamin Pavard', 'D1', 'Defender', 2, 3),
    ('3', 'Raphaël Varane', 'D1', 'Defender', 1, 1),
    ('4', 'Presnel Kimpembe', 'D1', 'Defender', 0, 5),
    ('5', 'Lucas Hernandez', 'D1', 'Defender', 1, 2),
    ('6', 'Paul Pogba', 'D1', 'Winger', 5, 1),
    ('7', 'Antoine Griezmann', 'D1', 'Pivot', 12, 2),
    ('8', 'N''Golo Kanté', 'D1', 'Winger', 3, 0),
    ('9', 'Olivier Giroud', 'D1', 'Pivot', 15, 4),
    ('10', 'Kylian Mbappé', 'D1', 'Pivot', 22, 3),
    ('11', 'Ousmane Dembélé', 'D2', 'Winger', 8, 6),
    ('12', 'Corentin Tolisso', 'D2', 'Winger', 4, 1);

