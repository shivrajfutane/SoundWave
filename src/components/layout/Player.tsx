'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Heart, ListMusic, Maximize2, Mic2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/lib/store/player'
import { useLibraryStore } from '@/lib/store/library'

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

export default function Player() {
  const [mounted, setMounted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const {
    currentSong, isPlaying, progress, duration, volume, isMuted, isShuffled, repeatMode,
    pause, resume, next, previous, seek, setVolume, toggleMute, toggleShuffle, toggleRepeat, toggleNowPlaying, isLyricsOpen, toggleLyrics, setProgress,
    isNowPlayingOpen, isResolving
  } = usePlayerStore()

  const isOverlayOpen = isNowPlayingOpen || isLyricsOpen

  const ytPlayerRef = useRef<any>(null)
  const [ytReady, setYtReady] = useState(false)

  const { toggleLike, isLiked } = useLibraryStore()
  const liked = currentSong ? isLiked(currentSong.id) : false

  useEffect(() => { setMounted(true) }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) pause()
        else resume()
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault()
        next()
      }

      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        previous()
      }

      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setVolume(Math.min(1, volume + 0.1))
      }

      if (e.code === 'ArrowDown') {
        e.preventDefault()
        setVolume(Math.max(0, volume - 0.1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, pause, resume, next, previous, volume, setVolume])

  // Load YouTube API
  useEffect(() => {
    if (window.YT) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    window.onYouTubeIframeAPIReady = () => {
      console.log('[Player] YouTube API Ready')
    }
  }, [])

  // Manage YouTube Player Lifecycle
  useEffect(() => {
    if (currentSong?.source !== 'youtube' || !window.YT) return

    const initPlayer = () => {
      if (ytPlayerRef.current) {
        if (typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(currentSong.youtube_id)
          if (isPlaying) ytPlayerRef.current.playVideo()
          else ytPlayerRef.current.pauseVideo()
        }
        return
      }

      const container = document.getElementById('yt-player-container')
      if (!container) return // Make sure DOM element exists

      ytPlayerRef.current = new window.YT.Player('yt-player-container', {
        height: '1',
        width: '1',
        videoId: currentSong.youtube_id,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            setYtReady(true)
            event.target.setVolume(volume * 100)
            if (isPlaying) event.target.playVideo()
            event.target.unMute() // Explicitly unmute to ensure sound
          },
          onStateChange: (event: any) => {
            console.log('[Player] YT State Change:', event.data)
            // Synchronize state back if YouTube finishes
            if (event.data === window.YT.PlayerState.ENDED) {
              next()
            }
          },
          onError: (event: any) => {
            console.error('[Player] YT Error:', event.data)
            // Error codes: 2 (invalid param), 5 (HTML5 error), 100 (not found), 101/150 (not allowed)
            if (event.data === 101 || event.data === 150) {
              console.warn('[Player] Video is restricted. Trying fallback or next.')
            }
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer()
          clearInterval(checkInterval)
        }
      }, 500)
      return () => clearInterval(checkInterval)
    }
  }, [currentSong?.id, currentSong?.source]) // Re-init only when song changes

  // Sync Pause/Resume/Volume for YouTube
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReady || currentSong?.source !== 'youtube') return

    if (isPlaying) {
      ytPlayerRef.current.playVideo()
      // Adding a slight delay to allow the browser to process the play intent before unmuting
      setTimeout(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.unMute) {
          ytPlayerRef.current.unMute()
        }
      }, 100)
    } else {
      ytPlayerRef.current.pauseVideo()
    }

    ytPlayerRef.current.setVolume(volume * 100)
    if (isMuted) ytPlayerRef.current.mute()
    else ytPlayerRef.current.unMute()
  }, [isPlaying, volume, isMuted, ytReady, currentSong?.id])

  // Reactive seeking: detect if store progress jumps significantly (manual seek)
  const lastProgressRef = useRef(progress)
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReady || currentSong?.source !== 'youtube') return
    
    const diff = Math.abs(progress - lastProgressRef.current)
    if (diff > 2) { // Threshold for "manual seek" vs "ticker update"
      ytPlayerRef.current.seekTo(progress, true)
    }
    lastProgressRef.current = progress
  }, [progress, ytReady, currentSong?.source])

  // Progress Ticker for YouTube
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReady || currentSong?.source !== 'youtube' || !isPlaying) return

    const ticker = setInterval(() => {
      if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        const time = ytPlayerRef.current.getCurrentTime()
        const state = ytPlayerRef.current.getPlayerState?.()
        if (time > 0) setProgress(time)
        
        // Log state transitions if stuck
        if (time <= 1 && isPlaying) {
          console.log('[Player] YT State:', state, 'Time:', time)
        }
      }
    }, 1000)

    return () => clearInterval(ticker)
  }, [isPlaying, ytReady, currentSong?.id])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  const progressPct = Math.max(0, Math.min(100, (progress / (duration || 1)) * 100))

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const p = (e.clientX - rect.left) / rect.width
    seek(p * duration)
  }

  if (!mounted || !currentSong) return null

  return (
    <>
      {/* Persistent YouTube IFrame container - always mounted out of sight */}
      <div 
        className="fixed pointer-events-none opacity-0" 
        style={{ left: '-1000px', top: '-1000px', width: '200px', height: '200px', zIndex: -100 }}
      >
        <div id="yt-player-container" />
      </div>

      <AnimatePresence>
        {!isOverlayOpen && (
          <motion.div
            key="player"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            className="fixed bottom-[64px] md:bottom-0 left-0 right-0 h-[72px] md:h-[90px] bg-[#181818] border-t border-white/[0.08] z-[100] flex items-center px-4 gap-4 md:gap-6"
          >
            {/* Mobile progress line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 md:hidden">
          <div
            className="h-full bg-accent-primary"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* INVISIBLE YOUTUBE PLAYER 
            We inject this when a song falls back to YouTube so that we can bridge controls
        */}
        {/* NO LONGER CONDITIONALLY RENDERED HERE - moved to end for persistence */}

        {/* ───── LEFT: Song info ───── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSong.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 w-full md:w-[30%] min-w-0 flex-shrink-0 cursor-pointer group/info"
            onClick={() => toggleNowPlaying(true)}
          >
            {/* Album art */}
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded overflow-hidden flex-shrink-0 shadow-lg group/art">
              <img
                src={currentSong.cover_url || '/placeholder-cover.png'}
                alt={currentSong.title}
                className="w-full h-full object-cover transition-transform group-hover/info:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/info:bg-black/40 flex items-center justify-center opacity-0 group-hover/info:opacity-100 transition-all">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Title + artist */}
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate hover:underline cursor-pointer">
                {currentSong.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-text-secondary text-xs truncate hover:underline hover:text-white cursor-pointer transition-colors">
                  {currentSong.artist}
                </p>
                <span className="hidden md:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70 shadow-sm border border-white/5">
                  {currentSong.source === 'youtube' ? 'Official Audio' : 'Free Track'}
                </span>
              </div>
            </div>

            {/* Like button */}
            <motion.button
              onClick={() => toggleLike(currentSong)}
              whileTap={{ scale: 0.8 }}
              animate={liked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.25 }}
              className={`hidden md:flex flex-shrink-0 ${liked ? 'text-accent-primary' : 'text-text-secondary hover:text-white'} transition-colors`}
              aria-label={liked ? 'Remove from liked songs' : 'Save to liked songs'}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* ───── CENTER: Controls ───── */}
        <div className="hidden md:flex flex-col items-center flex-1 max-w-[45%] gap-1">
          {/* Buttons */}
          <div className="flex items-center gap-5">
            {/* Shuffle */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={toggleShuffle}
              className={`transition-colors relative ${isShuffled ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
              {isShuffled && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-primary rounded-full" />
              )}
            </motion.button>

            {/* Previous */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={previous}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </motion.button>

            {/* Play/Pause */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => isPlaying ? pause() : resume()}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isResolving 
                ? <Loader2 className="w-4 h-4 animate-spin my-auto mx-auto" />
                : isPlaying
                  ? <Pause className="w-4 h-4 fill-current m-auto" />
                  : <Play className="w-4 h-4 fill-current translate-x-[1px] m-auto" />
              }
            </motion.button>

            {/* Next */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={next}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </motion.button>

            {/* Repeat */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={toggleRepeat}
              className={`transition-colors relative ${repeatMode !== 'off' ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
              title={repeatMode === 'off' ? 'Enable repeat' : repeatMode === 'one' ? 'Repeat one' : 'Repeat all'}
            >
              {repeatMode === 'one'
                ? <Repeat1 className="w-4 h-4" />
                : <Repeat className="w-4 h-4" />
              }
              {repeatMode !== 'off' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-primary rounded-full" />
              )}
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] text-text-muted font-mono w-8 text-right">{fmt(progress)}</span>
            <div
              ref={progressRef}
              className="flex-1 group h-1 hover:h-[5px] bg-white/20 rounded-full cursor-pointer relative transition-all duration-150"
              onClick={handleProgressClick}
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-white group-hover:bg-accent-primary rounded-full transition-colors"
                style={{ width: `${progressPct}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-[10px] text-text-muted font-mono w-8">{fmt(duration)}</span>
          </div>
        </div>

        {/* ───── RIGHT: Volume + extras ───── */}
        <div className="hidden md:flex items-center justify-end gap-3 w-[30%] flex-shrink-0">
          <button 
            onClick={() => toggleNowPlaying(true)}
            className="text-text-secondary hover:text-white transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => toggleLyrics()}
            className={`transition-colors ${isLyricsOpen ? 'text-accent-primary' : 'text-text-secondary hover:text-white'}`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <button className="text-text-secondary hover:text-white transition-colors">
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 w-28">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={toggleMute}
              className="text-text-secondary hover:text-white transition-colors"
            >
              {isMuted || volume === 0
                ? <VolumeX className="w-4 h-4" />
                : <Volume2 className="w-4 h-4" />
              }
            </motion.button>
            <div
              className="flex-1 group h-1 hover:h-[5px] bg-white/20 rounded-full cursor-pointer relative transition-all duration-150"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-white group-hover:bg-accent-primary rounded-full transition-colors"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Play + Heart only */}
        <div className="flex md:hidden items-center gap-4 ml-auto flex-shrink-0">
          <motion.button
            onClick={() => toggleLike(currentSong)}
            whileTap={{ scale: 0.8 }}
            className={liked ? 'text-accent-primary' : 'text-text-secondary'}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => isPlaying ? pause() : resume()}
            className="text-white"
          >
            {isResolving
              ? <Loader2 className="w-7 h-7 animate-spin text-accent-primary my-auto mx-auto" />
              : isPlaying
                ? <Pause className="w-7 h-7 fill-current m-auto" />
                : <Play className="w-7 h-7 fill-current translate-x-[1px] m-auto" />
            }
          </motion.button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
