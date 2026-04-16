-- Enable UUID
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Songs
create table songs (
  id uuid default uuid_generate_v4() primary key,
  jamendo_id text unique,
  title text not null,
  artist text not null,
  album text,
  genre text,
  duration integer not null default 0,
  cover_url text,
  audio_url text not null,
  play_count integer default 0,
  created_at timestamptz default now()
);

-- Playlists
create table playlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade not null,
  name text not null,
  description text,
  cover_url text,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- Playlist songs
create table playlist_songs (
  id uuid default uuid_generate_v4() primary key,
  playlist_id uuid references playlists on delete cascade not null,
  song_id uuid references songs on delete cascade not null,
  position integer not null default 0,
  added_at timestamptz default now(),
  unique(playlist_id, song_id)
);

-- Liked songs
create table liked_songs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade not null,
  song_id uuid references songs on delete cascade not null,
  liked_at timestamptz default now(),
  unique(user_id, song_id)
);

-- Listening history
create table listening_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade not null,
  song_id uuid references songs on delete cascade not null,
  played_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table songs enable row level security;
alter table playlists enable row level security;
alter table playlist_songs enable row level security;
alter table liked_songs enable row level security;
alter table listening_history enable row level security;

-- Profiles: users can read all, only update own
create policy "Profiles are viewable by all" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Songs: readable by all, no public insert
create policy "Songs are readable by all" on songs for select using (true);

-- Playlists: public readable, owner has full access
create policy "Public playlists are viewable by all" on playlists for select using (is_public = true or auth.uid() = user_id);
create policy "Users can manage own playlists" on playlists for all using (auth.uid() = user_id);

-- Playlist songs: readable if playlist is readable
create policy "Playlist songs follow playlist visibility" on playlist_songs for select using (
  exists (select 1 from playlists p where p.id = playlist_id and (p.is_public = true or p.user_id = auth.uid()))
);
create policy "Playlist owners can manage songs" on playlist_songs for all using (
  exists (select 1 from playlists p where p.id = playlist_id and p.user_id = auth.uid())
);

-- Liked songs: private per user
create policy "Users manage own likes" on liked_songs for all using (auth.uid() = user_id);

-- History: private per user
create policy "Users manage own history" on listening_history for all using (auth.uid() = user_id);
