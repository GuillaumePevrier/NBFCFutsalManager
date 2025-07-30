-- Ce script est conçu pour être ré-exécutable sans erreur.

-- 1. S'assurer que les colonnes de statistiques existent
-- ALTER TABLE ADD COLUMN IF NOT EXISTS est une syntaxe standard et sûre.
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS goals integer NOT NULL DEFAULT 0;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS fouls integer NOT NULL DEFAULT 0;


-- 2. Ajouter la contrainte UNIQUE sur le nom du joueur, si elle n'existe pas déjà
-- C'est la correction clé pour l'erreur "ON CONFLICT".
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'players_name_key' AND conrelid = 'public.players'::regclass
    ) THEN
        ALTER TABLE public.players ADD CONSTRAINT players_name_key UNIQUE (name);
    END IF;
END;
$$;


-- 3. Insérer les joueurs (uniquement s'ils n'existent pas déjà)
-- Maintenant que la contrainte UNIQUE sur "name" existe, le ON CONFLICT fonctionnera.
INSERT INTO public.players (name, team, "position", preferred_foot, goals, fouls) VALUES
    ('Guillaume Pevrier', 'D1', 'Winger', 'Right', 0, 0),
    ('Thomas Dubreuil', 'D1', 'Pivot', 'Right', 0, 0),
    ('Killian Olivier', 'D1', 'Goalkeeper', 'Right', 0, 0),
    ('Matthieu Pevrier', 'D1', 'Defender', 'Right', 0, 0),
    ('Titouan Leveque', 'D1', 'Winger', 'Right', 0, 0),
    ('Arthur Vignais', 'D1', 'Winger', 'Right', 0, 0),
    ('Yohann Vallee', 'D2', 'Pivot', 'Right', 0, 0),
    ('Gwendal Poutrain', 'D2', 'Defender', 'Left', 0, 0),
    ('Benjamin Poivet', 'D2', 'Winger', 'Right', 0, 0),
    ('Mickael Bouvier', 'D2', 'Defender', 'Right', 0, 0),
    ('Antoine Gloanec', 'D2', 'Winger', 'Right', 0, 0),
    ('Romain Duval', 'D2', 'Goalkeeper', 'Right', 0, 0)
ON CONFLICT (name) DO NOTHING;


-- 4. Activer la Row Level Security (RLS) sur la table si ce n'est pas déjà fait.
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;


-- 5. Créer ou remplacer les politiques de sécurité (les rend idempotentes)
-- Politique de LECTURE : tout le monde peut voir les joueurs.
DROP POLICY IF EXISTS "Public players are viewable by everyone." ON public.players;
CREATE POLICY "Public players are viewable by everyone." ON public.players
    FOR SELECT USING (true);

-- Politique d'INSERTION, MISE À JOUR, SUPPRESSION : Seuls les utilisateurs connectés (coachs) peuvent modifier.
DROP POLICY IF EXISTS "Coaches can insert/update/delete players." ON public.players;
CREATE POLICY "Coaches can insert/update/delete players." ON public.players
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- Affiche un message de succès.
SELECT 'Script de migration pour la table players exécuté avec succès.';
