-- Supabase SQL Schema for Playlists & Likes

-- 1. Create Playlists Table
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Playlist Tracks Table
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id text NOT NULL, -- references Jamendo API ID
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- ensure a song can only be added once per playlist
  UNIQUE(playlist_id, song_id)
);

-- 3. Update or Create Liked Tracks Table
-- Assuming 'liked_songs' exists, if not this creates it. 
-- Song ID is Jamendo text ID.
CREATE TABLE IF NOT EXISTS public.liked_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id text NOT NULL, -- references Jamendo API ID
  liked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(user_id, song_id)
);

-- Row Level Security (RLS) Policies

-- Playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own playlists" ON public.playlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own playlists" ON public.playlists FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Playlists are viewable by everyone if shared functionally (simplified as public view)" ON public.playlists FOR SELECT USING (true); -- Allow public sharing

-- Playlist Tracks
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view playlist tracks" ON public.playlist_tracks FOR SELECT USING (true);
CREATE POLICY "Users can insert tracks to their playlists" ON public.playlist_tracks 
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete tracks from their playlists" ON public.playlist_tracks 
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid()));

-- Liked Tracks
ALTER TABLE public.liked_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own liked tracks" ON public.liked_tracks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own liked tracks" ON public.liked_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own liked tracks" ON public.liked_tracks FOR DELETE USING (auth.uid() = user_id);
