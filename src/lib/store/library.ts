import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Song } from './player'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export interface RecentlyPlayedEntry {
  song: Song
  playedAt: number // timestamp
}

export interface Playlist {
  id: string
  name: string
  description?: string | null
  created_at: string
  tracks: Song[]
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface LibraryState {
  likedSongs: Song[]
  recentlyPlayed: RecentlyPlayedEntry[]
  playlists: Playlist[]
  user: UserProfile | null

  // Actions
  toggleLike: (song: Song) => void
  isLiked: (id: string) => boolean
  addToRecentlyPlayed: (song: Song) => void
  clearRecentlyPlayed: () => void

  // Playlist Actions
  createPlaylist: (name: string, description?: string) => void
  addTrackToPlaylist: (playlistId: string, song: Song) => void
  removeTrackFromPlaylist: (playlistId: string, songId: string) => void
  deletePlaylist: (playlistId: string) => void

  // Profile Actions
  setUser: (user: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      recentlyPlayed: [],
      playlists: [],
      user: null,

      toggleLike: async (song) => {
        const { likedSongs } = get()
        const already = likedSongs.some(s => s.id === song.id)
        
        // Optimistic UI Update
        set({
          likedSongs: already
            ? likedSongs.filter(s => s.id !== song.id)
            : [song, ...likedSongs],
        })
        toast.success(already ? 'Removed from Liked Songs' : 'Added to Liked Songs')

        // Async Database Sync (if logged in)
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) return

          if (already) {
            await supabase.from('liked_songs').delete().match({ user_id: session.user.id, song_id: song.id })
          } else {
            await supabase.from('liked_songs').insert({ user_id: session.user.id, song_id: song.id })
          }
        } catch (e) {
          console.error('[LibraryStore] Sync Like Error:', e)
        }
      },

      isLiked: (id) => get().likedSongs.some(s => s.id === id),

      addToRecentlyPlayed: (song) => {
        set(state => {
          const filtered = state.recentlyPlayed.filter(e => e.song.id !== song.id)
          return {
            recentlyPlayed: [{ song, playedAt: Date.now() }, ...filtered].slice(0, 50),
          }
        })
      },

      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),

      createPlaylist: async (name, description) => {
        const id = generateId()
        const newPlaylist: Playlist = {
          id,
          name,
          description,
          created_at: new Date().toISOString(),
          tracks: []
        }

        set(state => ({ playlists: [newPlaylist, ...state.playlists] }))
        toast.success(`Playlist "${name}" created`)

        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const { data } = await supabase.from('playlists').insert({
              name,
              description,
              user_id: session.user.id
            }).select('id').single()

            if (data?.id) {
              // Swap temp ID for real absolute Supabase ID so future mutations work cleanly
              set(state => ({
                playlists: state.playlists.map(p => p.id === id ? { ...p, id: data.id } : p)
              }))
            }
          }
        } catch (e) {
          console.error('[LibraryStore] Create Playlist Sync Error:', e)
        }
      },

      addTrackToPlaylist: async (playlistId, song) => {
        const { playlists } = get()
        const target = playlists.find(p => p.id === playlistId)
        
        if (!target) return
        if (target.tracks.some(t => t.id === song.id)) {
          toast.error(`Already in "${target.name}"`)
          return
        }

        // Optimistic UI Update
        const updatedTracks = [...target.tracks, song]
        set(state => ({
          playlists: state.playlists.map(p => p.id === playlistId ? { ...p, tracks: updatedTracks } : p)
        }))
        toast.success(`Added to "${target.name}"`)

        // Database Sync
        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session && playlistId.length > 15) { // Ensure it's a real UUID, not our temp math.random ID
            await supabase.from('playlist_tracks').insert({
              playlist_id: playlistId,
              song_id: song.id
            })
          }
        } catch (e) {
          console.error('[LibraryStore] Add Track Sync Error:', e)
        }
      },

      removeTrackFromPlaylist: async (playlistId, songId) => {
        const { playlists } = get()
        const target = playlists.find(p => p.id === playlistId)
        if (!target) return

        // Optimistic Update
        set(state => ({
          playlists: state.playlists.map(p => p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== songId) } : p)
        }))
        toast.success(`Removed from "${target.name}"`)

        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session && playlistId.length > 15) {
            await supabase.from('playlist_tracks').delete().match({
              playlist_id: playlistId,
              song_id: songId
            })
          }
        } catch (e) {
          console.error('[LibraryStore] Remove Track Sync Error:', e)
        }
      },

      deletePlaylist: async (playlistId) => {
        set(state => ({
          playlists: state.playlists.filter(p => p.id !== playlistId)
        }))
        toast.success('Playlist deleted')

        try {
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          if (session && playlistId.length > 15) {
            await supabase.from('playlists').delete().match({ id: playlistId })
          }
        } catch (e) {
          console.error('[LibraryStore] Delete Playlist Sync Error:', e)
        }
      },

      setUser: (user) => set({ user }),

      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) return

        const newUser = { ...user, ...updates }
        set({ user: newUser })

        try {
          const supabase = createClient()
          // In a real app, you might sync this to a 'profiles' table
          // For now we just update the local session metadata if possible, 
          // but mainly we update the store which is persisted.
          await supabase.auth.updateUser({
            data: { 
              full_name: newUser.name,
              avatar_url: newUser.avatar_url 
            }
          })
          toast.success('Profile updated')
        } catch (e) {
          console.error('[LibraryStore] Update Profile Error:', e)
        }
      }
    }),
    {
      name: 'soundwave-library',
    }
  )
)
