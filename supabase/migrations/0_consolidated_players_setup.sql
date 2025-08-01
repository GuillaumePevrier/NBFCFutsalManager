-- supabase/migrations/0_consolidated_players_setup.sql

-- Forcer le passage au schéma public (le plus courant)
SET search_path TO public;

-- Supprimer les anciens types ENUM s'ils existent pour éviter les conflits
-- Cela permet au script d'être exécuté plusieurs fois en toute sécurité
DROP TYPE IF EXISTS player_team_enum CASCADE;
DROP TYPE IF EXISTS player_position_enum CASCADE;
DROP TYPE IF EXISTS player_foot_enum CASCADE;

-- Création de la table "players" si elle n'existe pas déjà.
-- Utilisation de TEXT avec des contraintes CHECK au lieu de types ENUM personnalisés.
CREATE TABLE IF NOT EXISTS players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    email text UNIQUE,
    age integer,
    avatar_url text,
    team text CHECK (team IN ('D1', 'D2', 'Autre')),
    position text CHECK (position IN ('Gardien', 'Défenseur', 'Ailier', 'Pivot')),
    preferred_foot text CHECK (preferred_foot IN ('Droit', 'Gauche', 'Ambidextre')),
    goals integer DEFAULT 0,
    fouls integer DEFAULT 0
);

-- Activation de la Row Level Security (RLS) sur la table des joueurs.
-- C'est une mesure de sécurité essentielle.
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes policies pour éviter les conflits et les doublons.
DROP POLICY IF EXISTS "Les coachs peuvent tout faire" ON players;
DROP POLICY IF EXISTS "Tout le monde peut voir les joueurs" ON players;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON players;
DROP POLICY IF EXISTS "Enable read access for all users" ON players;

-- Création des nouvelles policies RLS :
-- 1. Tout le monde (utilisateurs connectés ou non) peut LIRE les informations des joueurs.
CREATE POLICY "Enable read access for all users" ON players
FOR SELECT USING (true);

-- 2. Seuls les coachs (utilisateurs authentifiés) peuvent AJOUTER, MODIFIER et SUPPRIMER des joueurs.
-- La fonction auth.role() récupère le rôle de l'utilisateur connecté.
CREATE POLICY "Allow all access for authenticated users" ON players
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- Nettoyage des doublons de joueurs basés sur le nom
-- Garde la première entrée (la plus ancienne) et supprime les doublons
DELETE FROM players
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id, 
            row_number() OVER(PARTITION BY name ORDER BY created_at) as rn
        FROM players
    ) t
    WHERE t.rn > 1
);

-- Création de la table "opponents" pour la gestion future des adversaires
CREATE TABLE IF NOT EXISTS opponents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL UNIQUE,
    logo_url text
);

-- Activation de la RLS pour la table des adversaires
ALTER TABLE opponents ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les adversaires (utile pour les menus déroulants futurs)
CREATE POLICY "Enable read access for all users on opponents" ON opponents
FOR SELECT USING (true);

-- Seuls les coachs peuvent gérer la liste des adversaires
CREATE POLICY "Allow authenticated users to manage opponents" ON opponents
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');


-- Affiche un message de succès dans la console de l'éditeur SQL.
SELECT 'Script de configuration des joueurs et adversaires exécuté avec succès.';
