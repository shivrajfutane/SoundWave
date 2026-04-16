import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Song } from '@/lib/store/player'

export async function POST(req: Request) {
  try {
    const { song } = await req.json() as { song: Song }

    if (!song || !song.id) {
      return NextResponse.json({ error: 'Song object required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Sync song details to supabase if not exists
    const { error } = await supabase
      .from('songs')
      .upsert({
        id: song.id,
        jamendo_id: song.id, // For Jamendo songs, the ID is standard
        title: song.title,
        artist: song.artist,
        album: song.album || null,
        duration: song.duration,
        cover_url: song.cover_url || null,
        audio_url: song.audio_url,
      }, { onConflict: 'id' })

    if (error) {
      console.error('Error syncing song', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
