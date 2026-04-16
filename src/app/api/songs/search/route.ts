import { NextResponse } from 'next/server'
import { searchTracks, mapToSong } from '@/lib/jamendo'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  try {
    const results = await searchTracks(query, 20)
    const songs = results.map(mapToSong)
    return NextResponse.json({ songs })
  } catch (error) {
    console.error('Jamendo Search Error:', error)
    return NextResponse.json({ error: 'Failed to search tracks' }, { status: 500 })
  }
}
