export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string
          jamendo_id: string
          title: string
          artist: string
          album: string | null
          duration: number
          cover_url: string | null
          audio_url: string
        }
        Insert: {
          id: string
          jamendo_id: string
          title: string
          artist: string
          album?: string | null
          duration: number
          cover_url?: string | null
          audio_url: string
        }
        Update: {
          id?: string
          jamendo_id?: string
          title?: string
          artist?: string
          album?: string | null
          duration?: number
          cover_url?: string | null
          audio_url?: string
        }
        Relationships: []
      }
      liked_songs: {
        Row: {
          id: number
          liked_at: string
          user_id: string
          song_id: string
        }
        Insert: {
          id?: number
          liked_at?: string
          user_id: string
          song_id: string
        }
        Update: {
          id?: number
          liked_at?: string
          user_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liked_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          }
        ]
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          id: string
          playlist_id: string
          song_id: string
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          song_id: string
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          song_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
