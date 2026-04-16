import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')
  const title = searchParams.get('title')

  if (!artist || !title) {
    return NextResponse.json({ error: 'Missing artist or title' }, { status: 400 })
  }

  // Clean strings for better matching
  const cleanTitle = title
    .replace(/\(official.*\)/gi, '')
    .replace(/\[official.*\]/gi, '')
    .replace(/\(lyrics.*\)/gi, '')
    .replace(/\[lyrics.*\]/gi, '')
    .replace(/\(video.*\)/gi, '')
    .replace(/\[video.*\]/gi, '')
    .replace(/\(hd.*\)/gi, '')
    .replace(/\[hd.*\]/gi, '')
    .replace(/\(4k.*\)/gi, '')
    .replace(/\[4k.*\]/gi, '')
    .replace(/- topic/gi, '')
    .trim()

  const cleanArtist = artist
    .replace(/- topic/gi, '')
    .trim()

  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[Lyrics Proxy Error]', err)
    return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: 500 })
  }
}
