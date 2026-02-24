-- ============================================
-- Boxing Forum - Supabase Schema
-- ============================================

-- 1. Profiles table (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Messages table (real-time forum)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- 3. Secret passwords table
create table if not exists public.secret_passwords (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  content_key text not null
);

-- ============================================
-- RLS Policies
-- ============================================

alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.secret_passwords enable row level security;

-- Profiles: anyone can read, users can update own row
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Messages: anyone can read, authenticated users can insert own messages
create policy "Messages are viewable by everyone"
  on public.messages for select
  using (true);

create policy "Authenticated users can insert own messages"
  on public.messages for insert
  with check (auth.uid() = user_id);

-- Secret passwords: no direct access (server-side only)
-- No policies = no access via client

-- ============================================
-- Auto-create profile on signup (trigger)
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Realtime
-- ============================================

alter publication supabase_realtime add table public.messages;

-- ============================================
-- Storage Buckets
-- ============================================

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Storage policies: profile-pictures
create policy "Anyone can view profile pictures"
  on storage.objects for select
  using (bucket_id = 'profile-pictures');

create policy "Authenticated users can upload profile pictures"
  on storage.objects for insert
  with check (bucket_id = 'profile-pictures' and auth.role() = 'authenticated');

create policy "Users can update own profile pictures"
  on storage.objects for update
  using (bucket_id = 'profile-pictures' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own profile pictures"
  on storage.objects for delete
  using (bucket_id = 'profile-pictures' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies: photos
create policy "Anyone can view photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
