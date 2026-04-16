export interface SpotifyTrack {
  id: string
  title: string
  artist: string
  album?: string
  cover_url: string
  duration: number
  source?: 'jamendo' | 'youtube' | undefined // Undefined initially, gets resolved later
  youtube_id?: string
  audio_url?: string
}

let cachedToken: string | null = null
let tokenExpirationTime: number | null = null

async function getSpotifyToken() {
  if (cachedToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return cachedToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials missing from environment variables')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Failed to get Spotify token:', err)
    throw new Error('Failed to fetch Spotify token')
  }

  const data = await response.json()
  cachedToken = data.access_token
  // Token usually expires in 3600 seconds, store it with a small buffer (e.g. 5 minutes)
  tokenExpirationTime = Date.now() + (data.expires_in - 300) * 1000

  return cachedToken
}

export async function searchSpotify(query: string, limit = 20): Promise<SpotifyTrack[]> {
  if (!query) return []

  const token = await getSpotifyToken()

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    const err = await response.text()
    console.error('Spotify Search API Error:', err)
    throw new Error('Spotify API Error')
  }

  const data = await response.json()

  if (!data.tracks || !data.tracks.items) {
    return []
  }

  return data.tracks.items.map((item: any) => ({
    id: item.id,
    title: item.name,
    artist: item.artists.map((a: any) => a.name).join(', '),
    album: item.album.name,
    cover_url: item.album.images[0]?.url || '/placeholder-cover.png',
    duration: Math.floor(item.duration_ms / 1000),
    source: undefined, // Requires resolution later
  }))
}
