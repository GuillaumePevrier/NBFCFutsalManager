-- =================================================================
--  NBFC Futsal Manager - Script SQL consolidé pour la table PLAYERS
-- =================================================================
--  Ce script gère la création et la configuration complète de la
--  table "players". Il est conçu pour être la source de vérité unique.
--
--  Il est idempotent : il supprime d'abord l'ancienne table pour
--  garantir une installation propre avant de la recréer.
--
--  Fonctionnalités incluses :
--  - Définition de la table avec des types de données optimisés.
--  - Ajout de colonnes pour des fonctionnalités futures (numéro, statut).
--  - Contraintes CHECK pour valider les données (postes, pieds forts).
--  - Activation et définition des politiques de sécurité (Row Level Security).
-- =================================================================


-- 1. Suppression de la table existante (si elle existe)
-- =================================================================
-- Utilise DROP TABLE ... CASCADE pour supprimer la table et tous les
-- objets qui en dépendent (comme les politiques RLS).
DROP TABLE IF EXISTS public.players CASCADE;


-- 2. Création de la table "players"
-- =================================================================
-- Crée la table avec toutes les colonnes nécessaires, y compris
-- celles pour de futures améliorations.
CREATE TABLE public.players (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Informations principales du joueur
    name text NOT NULL CHECK (char_length(name) >= 3),
    team text NOT NULL CHECK (team IN ('D1', 'D2', 'Autre')),
    
    -- Caractéristiques du joueur (nullables)
    "position" text CHECK ("position" IN ('Gardien', 'Défenseur', 'Ailier', 'Pivot', '')),
    preferred_foot text CHECK (preferred_foot IN ('Droit', 'Gauche', 'Ambidextre', '')),
    avatar_url text CHECK (avatar_url = '' OR avatar_url ~ '^https?://\S+$'),

    -- Statistiques (avec valeurs par défaut à 0)
    goals integer NOT NULL DEFAULT 0,
    fouls integer NOT NULL DEFAULT 0,

    -- Colonnes pour de futures fonctionnalités
    player_number integer, -- Numéro de maillot
    status text DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'blessé', 'suspendu'))
);

-- Ajout de commentaires pour la clarté
COMMENT ON TABLE public.players IS 'Table contenant l''effectif complet du club.';
COMMENT ON COLUMN public.players.player_number IS 'Numéro de maillot du joueur.';
COMMENT ON COLUMN public.players.status IS 'Statut actuel du joueur (actif, blessé, etc.).';


-- 3. Activation de la Row Level Security (RLS)
-- =================================================================
-- Active la sécurité au niveau des lignes sur la table.
-- C'est une étape cruciale pour la sécurité des données.
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;


-- 4. Création des politiques de sécurité (Policies)
-- =================================================================

-- Politique de LECTURE (SELECT) : Tout le monde peut voir les joueurs.
-- -----------------------------------------------------------------
-- Permet à n'importe quel utilisateur (authentifié ou non) de lire
-- les informations des joueurs.
CREATE POLICY "Allow public read access to players"
ON public.players
FOR SELECT
USING (true);


-- Politique d'ÉCRITURE (INSERT) : Seuls les coachs authentifiés peuvent ajouter des joueurs.
-- -----------------------------------------------------------------
-- Vérifie que l'utilisateur est bien connecté (rôle 'authenticated').
CREATE POLICY "Allow only authenticated coaches to insert players"
ON public.players
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- Politique de MODIFICATION (UPDATE) : Seuls les coachs authentifiés peuvent modifier.
-- -----------------------------------------------------------------
CREATE POLICY "Allow only authenticated coaches to update players"
ON public.players
FOR UPDATE
USING (auth.role() = 'authenticated');


-- Politique de SUPPRESSION (DELETE) : Seuls les coachs authentifiés peuvent supprimer.
-- -----------------------------------------------------------------
CREATE POLICY "Allow only authenticated coaches to delete players"
ON public.players
FOR DELETE
USING (auth.role() = 'authenticated');

-- =================================================================
--  Fin du scrip
-- =================================================================
-- test 20250814