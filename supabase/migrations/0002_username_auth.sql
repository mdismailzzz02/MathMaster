-- ============================================================
-- MathMaster — username-based auth
-- Adds a unique username to public.users and stores it on signup
-- from auth.users raw_user_meta_data.
-- Applied to project oipxdcgsmwzaljlezxhj as migration
-- "add_username_auth".
-- ============================================================

alter table public.users add column username text;

-- Backfill any existing users: derive from email local part
update public.users set username = split_part(coalesce(email, ''), '@', 1)
where username is null;

alter table public.users alter column username set not null;
create unique index users_username_unique on public.users (username);

-- Update auth trigger to persist username from user_metadata
create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
