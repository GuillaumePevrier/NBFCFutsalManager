
--  de données.
-- Il est exécuté automatiquement par Supabase lorsque vous déployez vos migrations.
-- IMPORTANT : Ce trigger nécessite que l'extension `http` soit activée.
--`create extension if not exists http ith schema extensions;` dans l'éditeur SQL de Supabase avant d'appliquer cette migration.

-- 1. Définition de la fonction qui sera appelée par le trigger.
create or replace function handle_match_update_and_notify()
returns trigger
language plpgsql
security definer -- Important pour permettre à la fonction d'utiliser des secrets.
as $$
declare
  -- Récupère  du webhook depuis les secrets de Supabase (Vault).
  -- C'est plus sécurisé que de la coder en dur.
  -- Allez dans Project Settings > Vault pour ajouter un secret nommé `MATCH_UPDATE_WEBHOOK_URL`.
  webhook_url text := 'https://nbfc-futsal-manager.vercel.app/api/match-update-webhook';
  payload jsonb;
begin
  -- Construit le payload JSON dans le même format que les webhooks natifs de Supabase.
  -- `old` et `new` sont des variables spéciales dans les triggers qui contiennent l'ancienne et la nouvelle ligne.
  payload := jsonb_build_object(
    'type',       'UPDATE',
    'table',      TG_TABLE_NAME,
    'schema',     TG_TABLE_SCHEMA,
    'record',     to_jsonb(new),
    'old_record', to_jsonb(old)
  );

  -- Effectue la requête HTTP POST vers notre API route Next.js.
  -- Note: Cette fonction est asynchrone et n'attendra pas de réponse,
  -- ce qui évite de ralentir les transactions de la base de données.
  perform extensions.http_request(
    webhook_url,
    'POST',
    'application/json',
    '{}',
    payload::text
  );

  return new;
end;
$$;

-- 2. Création du trigger qui écoute les événements UPDATE sur la table `matches`.
-- On s'assure de supprimer l'ancien trigger s'il existe pour éviter les doublons.
drop trigger if exists on_match_update_send_notification on public.matches;

create trigger on_match_update_send_notification
after update on public.matches
for each row
execute function public.handle_match_update_and_notify();

-- Commentaire pour expliquer le rôle de ce trigger.
comment on trigger on_match_update_send_notification on public.matches is 'Lorsqu''un match est mis à jour, appelle une fonction pour envoyer une notification via un webhook.';
