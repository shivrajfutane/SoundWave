import { NextResponse } from 'next/server'
import { searchSongs } from '@/lib/search' // Keep the old search functionality just to find Jamendo/YT matches

export async function POST(req: Request) {
  try {
    const { title, artist } = await req.json()

    if (!title || !artist) {
      return NextResponse.json({ error: 'Title and artist are required' }, { status: 400 })
    }

    const query = `${title} ${artist}`

    // We can reuse the cascaded Jamendo + YouTube logic we already built in search.ts!
    // Since we limit it to 1, it will be extremely fast and hit our cache layer.
    const searchResult = await searchSongs(query, 1)

    if (searchResult.hits && searchResult.hits.length > 0) {
      const topHit = searchResult.hits[0]
      return NextResponse.json({
        source: topHit.source,
        audio_url: topHit.audio_url,
        youtube_id: topHit.youtube_id,
        duration: topHit.duration
      })
    }

    return NextResponse.json({ error: 'No playable source found' }, { status: 404 })

  } catch (error) {
    console.error('Resolve Error:', error)
    return NextResponse.json({ error: 'Failed to resolve track' }, { status: 500 })
  }
}
