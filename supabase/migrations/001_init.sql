-- BookishChat schema: profiles, book entries, chat messages + RLS
-- Enable Google sign-in in Supabase Dashboard → Authentication → Providers
-- Safe to re-run: tables/indexes use IF NOT EXISTS; policies are dropped then recreated.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Book entries (library card rows)
create table if not exists public.book_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year int not null,
  sort_order int not null default 0,
  date_top text not null default '',
  date_bot text not null default '',
  title text not null default '',
  rate text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists book_entries_user_year_idx
  on public.book_entries (user_id, year, sort_order);

alter table public.book_entries enable row level security;

drop policy if exists "book_entries_select_own" on public.book_entries;
create policy "book_entries_select_own"
  on public.book_entries for select
  using (auth.uid() = user_id);

drop policy if exists "book_entries_insert_own" on public.book_entries;
create policy "book_entries_insert_own"
  on public.book_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "book_entries_update_own" on public.book_entries;
create policy "book_entries_update_own"
  on public.book_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "book_entries_delete_own" on public.book_entries;
create policy "book_entries_delete_own"
  on public.book_entries for delete
  using (auth.uid() = user_id);

-- Chat messages (per book conversation)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_key text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conv_idx
  on public.chat_messages (user_id, conversation_key, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
  on public.chat_messages for delete
  using (auth.uid() = user_id);

-- Auto-create profile on signup (Google metadata: full_name / name)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(new.raw_user_meta_data->>'name', ''),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
