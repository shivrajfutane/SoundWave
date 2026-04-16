import { NextResponse } from 'next/server'
import { searchSpotify } from '@/lib/spotify'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  const limitParam = searchParams.get('limit')
  const limit = Math.min(parseInt(limitParam || '10') || 10, 50)

  try {
    const start = Date.now()
    console.log("LIMIT:", limit)
    const songs = await searchSpotify(query, limit)
    return NextResponse.json({ 
      hits: songs, 
      total: songs.length, 
      query, 
      strategy: 'spotify_api', 
      cached: false, 
      took_ms: Date.now() - start 
    })
  } catch (error: any) {
    console.error('Spotify Search Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to search tracks' }, { status: 500 })
  }
}
