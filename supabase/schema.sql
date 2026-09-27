-- Frame Family Portal database setup.
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.
-- It is safe to run more than once.

-- Photos that family members upload for the frame to show.
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  caption text not null default '',
  image_path text not null,
  created_at timestamptz not null default now()
);

-- People the frame can call.
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  relationship text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

-- Row Level Security: a user can only see and change their own rows.
alter table public.photos enable row level security;
alter table public.contacts enable row level security;

drop policy if exists "Users manage their own photos" on public.photos;
create policy "Users manage their own photos" on public.photos
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own contacts" on public.contacts;
create policy "Users manage their own contacts" on public.contacts
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private storage bucket for the image files.
-- Each user uploads into a folder named after their user id.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "Users read their own photo files" on storage.objects;
create policy "Users read their own photo files" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload their own photo files" on storage.objects;
create policy "Users upload their own photo files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete their own photo files" on storage.objects;
create policy "Users delete their own photo files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
