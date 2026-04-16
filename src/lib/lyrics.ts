export function cleanLyricsTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, '') // remove (Official Video)
    .replace(/\[.*?\]/g, '') // remove [HD]
    .replace(/official|video|lyrics|audio|music|hd|4k|feat\.|ft\./gi, '') // remove keywords
    .trim()
}

export function extractArtistTitle(raw: string): { artist: string; title: string } {
  let cleaned = cleanLyricsTitle(raw)
  
  // Handle common delimiters: "-", "|", ":"
  cleaned = cleaned.replace('|', '-').replace(':', '-')
  
  const parts = cleaned.split('-')
  
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join('-').trim(),
    }
  }
  
  return { 
    artist: '', 
    title: cleaned 
  }
}

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  if (!title) return null
  
  try {
    // We use LRCLIB which is fast, accurate, and provides synced lyrics.
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`
    const res = await fetch(searchUrl)
    if (!res.ok) return null
    
    const data = await res.json()
    if (data && data.length > 0) {
      // LRCLIB returns an array of matches. The first one is usually the most relevant.
      const bestMatch = data[0]
      // Prefer synced lyrics for a better user experience, fallback to plain lyrics.
      return bestMatch.syncedLyrics || bestMatch.plainLyrics || null
    }

    return null
  } catch (err) {
    console.error('[Lyrics] Fetch error:', err)
    return null
  }
}
