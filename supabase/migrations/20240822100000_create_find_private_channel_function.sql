
-- supabase/migrations/{timestamp}_create_find_private_channel_function.sql

create or replace function find_private_channel(user_1_id uuid, user_2_id uuid)
returns uuid
language sql
as $$
  select c.id
  from channels c
  join channel_participants cp1 on c.id = cp1.channel_id
  join channel_participants cp2 on c.id = cp2.channel_id
  where c.type = 'private'
  and cp1.user_id = user_1_id
  and cp2.user_id = user_2_id
  limit 1;
$$;
