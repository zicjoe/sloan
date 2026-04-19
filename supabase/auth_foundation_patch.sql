create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_predictions boolean not null default true,
  notify_quests boolean not null default true,
  notify_raids boolean not null default false,
  notify_prophets boolean not null default true,
  theme text not null default 'dark',
  accent_color text not null default 'cyan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))), '[^a-z0-9_]', '_', 'g'), ''), 'sloan_user_' || left(new.id::text, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'sloan user'), '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, username, display_name)
select
  u.id,
  coalesce(nullif(regexp_replace(lower(coalesce(u.raw_user_meta_data ->> 'username', split_part(u.email, '@', 1))), '[^a-z0-9_]', '_', 'g'), ''), 'sloan_user_' || left(u.id::text, 8)),
  coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(u.email, 'sloan user'), '@', 1))
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

insert into public.user_settings (user_id)
select u.id
from auth.users u
where not exists (
  select 1 from public.user_settings s where s.user_id = u.id
);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "public read profiles" on public.profiles;
create policy "public read profiles"
  on public.profiles for select
  using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users read own settings" on public.user_settings;
create policy "users read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own settings" on public.user_settings;
create policy "users insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own settings" on public.user_settings;
create policy "users update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_profiles_username on public.profiles(username);
