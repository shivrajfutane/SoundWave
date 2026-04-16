// Jamendo API — Free tier: 50,000 requests/month
// Register at: https://developer.jamendo.com/v3.0
// Set NEXT_PUBLIC_JAMENDO_CLIENT_ID in .env.local

const BASE = 'https://api.jamendo.com/v3.0'
const CLIENT_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID

export interface JamendoTrack {
  id: string
  name: string
  artist_name: string
  album_name: string
  duration: number
  image: string
  audio: string
  audiodownload: string
  genre?: string
  shareurl: string
}

async function jamendoFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${endpoint}`)
  url.searchParams.set('client_id', CLIENT_ID || '')
  url.searchParams.set('format', 'json')
  url.searchParams.set('audioformat', 'mp32')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Jamendo API] Fetching: ${url.toString()}`)
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Jamendo error: ${res.status}`)
  const data = await res.json()
  return data.results as T
}

export const fetchTrending = (limit = 20) =>
  jamendoFetch<JamendoTrack[]>('/tracks', { limit: String(limit), order: 'popularity_week', include: 'musicinfo' })

export const fetchNewReleases = (limit = 20) =>
  jamendoFetch<JamendoTrack[]>('/tracks', { limit: String(limit), order: 'releasedate', include: 'musicinfo' })

export const searchTracks = (query: string, limit = 20) =>
  jamendoFetch<JamendoTrack[]>('/tracks', { namesearch: query, limit: String(limit), include: 'musicinfo' })

export const fetchByGenre = (genre: string, limit = 20) =>
  jamendoFetch<JamendoTrack[]>('/tracks', { tags: genre, limit: String(limit), include: 'musicinfo' })

export const fetchSimilar = (trackId: string, limit = 10) =>
  jamendoFetch<JamendoTrack[]>('/tracks/similar', { id: trackId, limit: String(limit) })

export const fetchArtistTracks = (artistName: string, limit = 20) =>
  jamendoFetch<JamendoTrack[]>('/tracks', { artist_name: artistName, limit: String(limit), include: 'musicinfo' })

export const fetchByTrackIds = (ids: string[]) =>
  jamendoFetch<JamendoTrack[]>('/tracks', { id: ids.join(','), include: 'musicinfo' })

// Map Jamendo track → Supabase song shape
export function mapToSong(track: JamendoTrack) {
  return {
    jamendo_id: track.id,
    title: track.name,
    artist: track.artist_name,
    album: track.album_name || undefined,
    duration: track.duration,
    cover_url: track.image,
    audio_url: track.audio,
  }
}
