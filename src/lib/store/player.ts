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
  audio_url: string
  duration: number
  source?: 'jamendo' | 'youtube'
  youtube_id?: string
}

// Helper to send commands to our hidden YouTube iframe
const sendYTCommand = (command: string, args: any[] = []) => {
  const iframe = document.getElementById('yt-player') as HTMLIFrameElement
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: command,
      args
    }), '*')
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

  play: (song, queue) => {
    const state = get()
    state.howl?.unload()

    const newQueue = queue ?? [song]
    const index = newQueue.findIndex(s => s.id === song.id)

    // Ensure AudioContext is running (browsers block it until interaction)
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume()
    }

    if (song.source === 'youtube') {
      // For YouTube, Player.tsx handles the iframe injection.
      // We just need to update state and start a progress ticker roughly.
      trackRecentlyPlayed(song)
      sendYTCommand('playVideo')

      // A simple fallback progress ticker for YouTube if we don't bind full API events
      let p = 0
      const ticker = setInterval(() => {
        p += 0.5
        const { isPlaying, currentSong } = get()
        if (isPlaying && currentSong?.source === 'youtube') {
           set({ progress: p })
           // We can get actual time via YT API, but postMessage is one-way for commands. 
           // Player.tsx will handle syncing time back to store if native.
        }
      }, 500)
      
      set({ currentSong: song, queue: newQueue, queueIndex: index, howl: null, isPlaying: true, progress: 0, duration: song.duration })
      return
    }

    const howl = new Howl({
      src: [song.audio_url],
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
      onloaderror: (id, err) => console.error('[Player] Load Error:', err, 'ID:', id, 'URL:', song.audio_url),
      onplayerror: (id, err) => {
        console.error('[Player] Play Error:', err)
        howl.once('unlock', () => howl.play())
      }
    })

    // Progress ticker
    const ticker = setInterval(() => {
      if (howl.playing()) {
        set({ progress: howl.seek() as number })
      }
    }, 500)

    howl.on('end', () => clearInterval(ticker))
    howl.on('stop', () => clearInterval(ticker))
    howl.play()
    trackRecentlyPlayed(song)

    set({ currentSong: song, queue: newQueue, queueIndex: index, howl, isPlaying: true })
  },

  pause: () => { 
    const { howl, currentSong } = get()
    if (currentSong?.source === 'youtube') sendYTCommand('pauseVideo')
    else howl?.pause()
    set({ isPlaying: false }) 
  },
  resume: () => { 
    const { howl, currentSong } = get()
    if (currentSong?.source === 'youtube') {
      sendYTCommand('playVideo')
    } else {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume()
      }
      howl?.play()
    }
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
    const { howl, currentSong } = get()
    if (currentSong?.source === 'youtube') {
      sendYTCommand('seekTo', [seconds, true])
    } else {
      howl?.seek(seconds)
    }
    set({ progress: seconds }) 
  },
  setVolume: (vol) => { 
    const { howl, currentSong } = get()
    if (currentSong?.source === 'youtube') sendYTCommand('setVolume', [vol * 100])
    else howl?.volume(vol)
    set({ volume: vol, isMuted: vol === 0 }) 
  },
  toggleMute: () => {
    const { isMuted, volume, howl, currentSong } = get()
    const willMute = !isMuted
    if (currentSong?.source === 'youtube') {
      sendYTCommand(willMute ? 'mute' : 'unMute')
    } else {
      howl?.volume(willMute ? 0 : volume)
    }
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
}))
