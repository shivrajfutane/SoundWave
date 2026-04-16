import { create } from 'zustand'
import { Howl, Howler } from 'howler'
// Lazy import to avoid circular dep — called at runtime
const trackRecentlyPlayed = (song: Song) => {
  try {
    // Dynamically get the library store without importing at module level
    const { useLibraryStore } = require('./library')
    useLibraryStore.getState().addToRecentlyPlayed(song)
  } catch {}
}

export type RepeatMode = 'off' | 'one' | 'all'

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  cover_url?: string
  audio_url?: string
  duration: number
  source?: 'jamendo' | 'youtube' | undefined
  youtube_id?: string
}

// YouTube commands are now handled reactively in Player.tsx using the official API
const sendYTCommand = (command: string, args: any[] = []) => {
  // Keeping as a placeholder for now, but most logic is shifted to reactive effects
}

// Singleton to track the active progress ticker and avoid memory leaks/conflicts
let activeTicker: NodeJS.Timeout | null = null

const clearTicker = () => {
  if (activeTicker) {
    clearInterval(activeTicker)
    activeTicker = null
  }
}

interface PlayerState {
  currentSong: Song | null
  queue: Song[]
  queueIndex: number
  isPlaying: boolean
  isShuffled: boolean
  repeatMode: RepeatMode
  volume: number
  isMuted: boolean
  progress: number
  duration: number
  howl: Howl | null

  // Actions
  play: (song: Song, queue?: Song[]) => void
  pause: () => void
  resume: () => void
  next: () => void
  previous: () => void
  seek: (seconds: number) => void
  setVolume: (vol: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  addToQueue: (song: Song) => void
  removeFromQueue: (index: number) => void
  setProgress: (p: number) => void
  isNowPlayingOpen: boolean
  toggleNowPlaying: (open?: boolean) => void
  isLyricsOpen: boolean
  toggleLyrics: (open?: boolean) => void
  lyrics: string | null
  setLyrics: (l: string | null) => void
  isResolving: boolean
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isShuffled: false,
  repeatMode: 'off',
  volume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  howl: null,
  isNowPlayingOpen: false,
  isResolving: false,

  play: async (song, queue) => {
    const state = get()
    state.howl?.unload()

    const newQueue = queue ?? [get().currentSong].filter(Boolean) as Song[]
    const finalQueue = newQueue.length > 0 ? newQueue : [song]
    const index = finalQueue.findIndex(s => s.id === song.id)

    // Ensure AudioContext is running (browsers block it until interaction)
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume()
    }

    set({ 
      currentSong: song, 
      queue: finalQueue, 
      queueIndex: index !== -1 ? index : 0, 
      howl: null, 
      isPlaying: false, 
      progress: 0, 
      duration: song.duration || 0,
      isResolving: true
    })

    let resolvedSong = song
    
    // Resolve audio if we only have Spotify metadata
    if (!song.source || (!song.audio_url && !song.youtube_id)) {
      try {
        const res = await fetch('/api/songs/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: song.title, artist: song.artist })
        })
        if (res.ok) {
          const data = await res.json()
          resolvedSong = { ...song, ...data }
          
          // Update the queue with resolved song
          const currentState = get()
          if (currentState.currentSong?.id === song.id) {
            const updatedQueue = [...currentState.queue]
            const qIdx = updatedQueue.findIndex(s => s.id === song.id)
            if (qIdx !== -1) updatedQueue[qIdx] = resolvedSong
            set({ currentSong: resolvedSong, queue: updatedQueue })
          }
        }
      } catch (err) {
        console.error('Failed to resolve track', err)
      }
    }

    set({ isResolving: false })

    // Check if user changed song while we were waiting
    if (get().currentSong?.id !== song.id) return

    trackRecentlyPlayed(resolvedSong)

    if (resolvedSong.source === 'youtube') {
      clearTicker()
      set({ isPlaying: true, duration: resolvedSong.duration })
      return
    }

    if (!resolvedSong.audio_url) {
      console.error('No audio url available after resolving.')
      return
    }

    const howl = new Howl({
      src: [resolvedSong.audio_url],
      html5: true, // Use HTML5 audio for better cross-domain support and efficiency
      format: ['mp3'],
      volume: state.isMuted ? 0 : state.volume,
      onend: () => get().next(),
      onplay: () => {
        const d = howl.duration()
        if (process.env.NODE_ENV === 'development') console.log(`[Player] Playing: ${song.title} (${d}s)`)
        if (d > 0) set({ isPlaying: true, duration: d })
        else set({ isPlaying: true })
      },
      onload: () => {
        const d = howl.duration()
        if (process.env.NODE_ENV === 'development') console.log(`[Player] Loaded: ${song.title} (${d}s)`)
        set({ duration: d })
      },
      onpause: () => set({ isPlaying: false }),
      onloaderror: (id, err) => {
        console.error('[Player] Load Error:', err, 'ID:', id, 'URL:', resolvedSong.audio_url)
        // If it failed with HTML5, try again without it (Web Audio API)
        // Some Jamendo streams serve content that browsers' HTML5 Audio is picky about
        if ((howl as any)._html5) {
          console.warn('[Player] HTML5 Load failed. Retrying with Web Audio API...')
          howl.unload()
          const retryHowl = new Howl({
            src: [resolvedSong.audio_url!],
            html5: false,
            format: ['mp3'],
            volume: get().isMuted ? 0 : get().volume,
            onplay: () => set({ isPlaying: true, duration: retryHowl.duration() }),
            onend: () => get().next(),
            onloaderror: (rid, rerr) => console.error('[Player] Retry failed:', rerr)
          })
          retryHowl.play()
          set({ howl: retryHowl })
        }
      },
      onplayerror: (id, err) => {
        console.error('[Player] Play Error:', err)
        howl.once('unlock', () => howl.play())
      }
    })

    // Progress ticker
    clearTicker()
    activeTicker = setInterval(() => {
      if (howl.playing()) {
        set({ progress: howl.seek() as number })
      }
    }, 500)

    howl.on('end', () => clearTicker())
    howl.on('stop', () => clearTicker())
    howl.on('play', () => {
      // If we resumed or re-started, ensure ticker is running
      if (!activeTicker) {
        activeTicker = setInterval(() => {
          if (howl.playing()) set({ progress: howl.seek() as number })
        }, 500)
      }
    })

    howl.play()
    trackRecentlyPlayed(song)

    set({ currentSong: song, queue: newQueue, queueIndex: index, howl, isPlaying: true })
  },

  pause: () => { 
    const { howl } = get()
    howl?.pause()
    set({ isPlaying: false }) 
  },
  resume: () => { 
    const { howl } = get()
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume()
    }
    howl?.play()
    set({ isPlaying: true }) 
  },

  next: () => {
    const { queue, queueIndex, repeatMode, isShuffled, play } = get()
    if (repeatMode === 'one') { get().seek(0); get().howl?.play(); return }
    const nextIndex = isShuffled
      ? Math.floor(Math.random() * queue.length)
      : queueIndex + 1
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') play(queue[0], queue)
      else set({ isPlaying: false })
      return
    }
    play(queue[nextIndex], queue)
  },

  previous: () => {
    const { queue, queueIndex, play, howl } = get()
    const seek = howl?.seek() as number ?? 0
    if (seek > 3) { howl?.seek(0); return }
    const prevIndex = Math.max(0, queueIndex - 1)
    play(queue[prevIndex], queue)
  },

  seek: (seconds) => { 
    const { howl } = get()
    howl?.seek(seconds)
    set({ progress: seconds }) 
  },
  setVolume: (vol) => { 
    const { howl } = get()
    howl?.volume(vol)
    set({ volume: vol, isMuted: vol === 0 }) 
  },
  toggleMute: () => {
    const { isMuted, volume, howl } = get()
    const willMute = !isMuted
    howl?.volume(willMute ? 0 : volume)
    set({ isMuted: willMute })
  },
  toggleShuffle: () => set(s => ({ isShuffled: !s.isShuffled })),
  toggleRepeat: () => set(s => ({
    repeatMode: s.repeatMode === 'off' ? 'one' : s.repeatMode === 'one' ? 'all' : 'off'
  })),
  addToQueue: (song) => set(s => ({ queue: [...s.queue, song] })),
  removeFromQueue: (index) => set(s => ({ queue: s.queue.filter((_, i) => i !== index) })),
  setProgress: (p) => set({ progress: p }),
  toggleNowPlaying: (open) => set(s => ({ isNowPlayingOpen: open ?? !s.isNowPlayingOpen })),
  isLyricsOpen: false,
  toggleLyrics: (open) => set(s => ({ isLyricsOpen: open ?? !s.isLyricsOpen })),
  lyrics: null,
  setLyrics: (l) => set({ lyrics: l }),
}))
