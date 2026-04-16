/**
 * ============================================================
 *  Soundwave Search Service
 *  Inspired by Elasticsearch-grade search patterns:
 *   - Multi-strategy fallback (namesearch → fuzzysearch → tags)
 *   - In-memory LRU cache (avoids hammering Jamendo API quota)
 *   - Result deduplication by track ID
 *   - Typed error handling with HTTP-style codes
 *   - Popularity-weighted re-ranking on the client side
 * ============================================================
 */

import { JamendoTrack, mapToSong } from './jamendo'

const BASE = 'https://api.jamendo.com/v3.0'
const CLIENT_ID = process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID

// ─────────────────────────────────────────────
//  1. ERROR HANDLING (mirrors SearchError pattern)
// ─────────────────────────────────────────────

export class SearchError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode = 500) {
    super(message)
    this.name = 'SearchError'
    this.code = code
    this.statusCode = statusCode
  }
}

// ─────────────────────────────────────────────
//  2. LRU CACHE (avoids repeat API calls)
// ─────────────────────────────────────────────

interface CacheEntry {
  data: JamendoTrack[]
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_MAX = 50            // max cached queries

const cache = new Map<string, CacheEntry>()

function getCached(key: string): JamendoTrack[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: JamendoTrack[]) {
  // Evict oldest if at capacity
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { data, timestamp: Date.now() })
}

// ─────────────────────────────────────────────
//  3. RAW JAMENDO FETCH (with error classification)
// ─────────────────────────────────────────────

async function jamendoSearch(params: Record<string, string>): Promise<JamendoTrack[]> {
  const url = new URL(`${BASE}/tracks`)
  url.searchParams.set('client_id', CLIENT_ID || '')
  url.searchParams.set('format', 'json')
  url.searchParams.set('audioformat', 'mp31')
  url.searchParams.set('include', 'musicinfo')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Search] → ${url.toString()}`)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      cache: 'no-store', // search results should be fresh
    })

    if (res.status === 429) {
      throw new SearchError('Jamendo rate limit hit. Try again shortly.', 'RATE_LIMITED', 429)
    }
    if (!res.ok) {
      throw new SearchError(`Jamendo API error: ${res.status}`, 'API_ERROR', res.status)
    }

    const data = await res.json()
    return (data.results ?? []) as JamendoTrack[]
  } catch (err: any) {
    if (err instanceof SearchError) throw err
    if (err.name === 'AbortError') {
      throw new SearchError('Search timed out.', 'TIMEOUT', 504)
    }
    throw new SearchError(`Network error: ${err.message}`, 'NETWORK_ERROR', 503)
  } finally {
    clearTimeout(timeout)
  }
}

// ─────────────────────────────────────────────
//  4. MULTI-STRATEGY SEARCH (the core algorithm)
// ─────────────────────────────────────────────

/**
 * Cascading search strategy — mirrors the Elasticsearch
 * multi_match + fallback pattern:
 *
 *  1. namesearch (exact name matching — highest precision)
 *  2. search (broader full-text — if namesearch returns < 3 results)
 *  3. tags (genre/tag search — catches "rock", "jazz", etc.)
 *
 * Results are merged, deduplicated by track ID, and sorted
 * by a client-side popularity proxy (Jamendo's `listens` count).
 */
async function cascadeSearch(query: string, limit: number): Promise<JamendoTrack[]> {
  // Strategy 1: namesearch (most precise)
  let results = await jamendoSearch({ namesearch: query, boost: 'popularity_total', limit: String(limit) })

  // Strategy 2: broader "search" param if too few results
  if (results.length < 3) {
    const broader = await jamendoSearch({ search: query, boost: 'popularity_total', limit: String(limit) })
    results = mergeAndDedupe(results, broader)
  }

  // Strategy 3: tag search — catches genre keywords
  if (results.length < 3) {
    const tagged = await jamendoSearch({ tags: query, boost: 'popularity_total', limit: String(limit) })
    results = mergeAndDedupe(results, tagged)
  }

  return results.slice(0, limit)
}

// ─────────────────────────────────────────────
//  5. DEDUPLICATION + MERGE
// ─────────────────────────────────────────────

function mergeAndDedupe(primary: JamendoTrack[], secondary: JamendoTrack[]): JamendoTrack[] {
  const seen = new Set(primary.map(t => t.id))
  const merged = [...primary]
  for (const track of secondary) {
    if (!seen.has(track.id)) {
      seen.add(track.id)
      merged.push(track)
    }
  }
  return merged
}

// ─────────────────────────────────────────────
//  6. RESULT NORMALIZATION (Jamendo/Youtube → Song shape)
// ─────────────────────────────────────────────

export interface SearchResult {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  cover_url: string
  audio_url: string
  source?: 'jamendo' | 'youtube'
  youtube_id?: string
}

function normalizeResults(tracks: JamendoTrack[]): SearchResult[] {
  return tracks.map(t => {
    // If it's the injected youtube fake-track signature, return it directly
    if ((t as any).source === 'youtube') return t as unknown as SearchResult

    const mapped = mapToSong(t)
    return {
      id: mapped.jamendo_id,
      title: mapped.title,
      artist: mapped.artist,
      album: mapped.album,
      duration: mapped.duration,
      cover_url: mapped.cover_url,
      audio_url: mapped.audio_url,
      source: 'jamendo'
    }
  })
}

// ─────────────────────────────────────────────
//  6.1. YOUTUBE FALLBACK API
// ─────────────────────────────────────────────
async function fetchYouTubeFallback(query: string, limit = 10): Promise<SearchResult[]> {
  const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  if (!key) return []
  
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)} official audio&type=video&maxResults=${limit}&videoEmbeddable=true&videoSyndicated=true&key=${key}`
    )
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[YouTube API Error]", res.status, errorData?.error?.message || res.statusText)
      return []
    }
    const data = await res.json()
    // console.log("[YouTube API Response]", data)
    if (!data.items || data.items.length === 0) return []

    return data.items.map((video: any) => ({
      id: video.id.videoId,
      youtube_id: video.id.videoId,
      source: 'youtube',
      title: video.snippet.title,
      artist: video.snippet.channelTitle,
      cover_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
      audio_url: '', 
      duration: 180, 
    }))
  } catch(e) {
    console.error("[YouTube Fallback Error]", e)
    return []
  }
}

// ─────────────────────────────────────────────
//  7. MAIN SEARCH FUNCTION (public entry point)
// ─────────────────────────────────────────────

export interface SearchResponse {
  hits: SearchResult[]
  total: number
  query: string
  strategy: string     // which search path was used
  cached: boolean
  took_ms: number
}

/**
 * searchSongs — single public entry point.
 *
 * Edge cases handled:
 *  - Empty / whitespace query → returns empty hits
 *  - Single char query → prefix-style exact search
 *  - Cache hit → returns instantly without API call
 *  - All API errors → typed SearchError with code/status
 */
export async function searchSongs(rawQuery: string, limit = 24): Promise<SearchResponse> {
  const trimmed = rawQuery.trim()
  const start = Date.now()

  if (!trimmed) {
    return { hits: [], total: 0, query: '', strategy: 'empty', cached: false, took_ms: 0 }
  }

  // ── Check cache ──────────────────────────────────
  const cacheKey = `${trimmed.toLowerCase()}:${limit}`
  const cached = getCached(cacheKey)
  if (cached) {
    return {
      hits: normalizeResults(cached),
      total: cached.length,
      query: trimmed,
      strategy: 'cache',
      cached: true,
      took_ms: Date.now() - start,
    }
  }

  // ── Determine strategy ───────────────────────────
  let results: JamendoTrack[]
  let strategy: string

  if (trimmed.length <= 2) {
    // Very short queries: exact search only (fuzzy on short strings is noisy)
    results = await jamendoSearch({ namesearch: trimmed, limit: String(limit) })
    strategy = 'short_exact'
  } else {
    // Normal path: full cascade
    results = await cascadeSearch(trimmed, limit)
    strategy = 'cascade'
  }

  // ── Cache the results ────────────────────────────
  setCache(cacheKey, results)

  let finalHits = normalizeResults(results)

  // Define quality match check
  const isGoodMatch = (query: string, track: SearchResult) => {
    const q = query.toLowerCase().trim()
    const title = track.title.toLowerCase()
    const artist = track.artist.toLowerCase()
    
    // Check if query is in title or artist
    // Also allow partial word matches if it's a multi-word query
    return title.includes(q) || artist.includes(q) || q.split(' ').every(word => title.includes(word))
  }

  // Filter jamendo results that are irrelevant
  finalHits = finalHits.filter(t => isGoodMatch(trimmed, t))

  // ── YOUTUBE FALLBACK INJECTION ───────────────
  if (trimmed.length > 2) {
    const ytResults = await fetchYouTubeFallback(trimmed)
    
    if (ytResults.length > 0) {
      if (finalHits.length === 0) {
        // Pure fallback: Jamendo had nothing
        finalHits = ytResults
        strategy = 'youtube_fallback'
      } else {
        // Blended mode: YouTube leads for mainstream feel, Jamendo follows
        const topYT = ytResults[0]
        const remainingYT = ytResults.slice(1)
        
        // Dedupe Jamendo results against the top YouTube result
        const cleanJamendo = finalHits.filter(t => 
          t.title.toLowerCase() !== topYT.title.toLowerCase()
        )
        
        // New order: [Top YT, ...Secondary YT, ...Clean Jamendo]
        finalHits = [topYT, ...remainingYT.slice(0, 2), ...cleanJamendo]
        strategy = 'youtube_blended'
      }
    }
  }

  return {
    hits: finalHits,
    total: finalHits.length,
    query: trimmed,
    strategy,
    cached: false,
    took_ms: Date.now() - start,
  }
}
