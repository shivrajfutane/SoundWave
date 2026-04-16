'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Heart, ListMusic, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/lib/store/player'
import { useLibraryStore } from '@/lib/store/library'

export default function Player() {
  const [mounted, setMounted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const {
    currentSong, isPlaying, progress, duration, volume, isMuted, isShuffled, repeatMode,
    pause, resume, next, previous, seek, setVolume, toggleMute, toggleShuffle, toggleRepeat, toggleNowPlaying
  } = usePlayerStore()

  const { toggleLike, isLiked } = useLibraryStore()
  const liked = currentSong ? isLiked(currentSong.id) : false

  useEffect(() => { setMounted(true) }, [])

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
    <AnimatePresence>
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
            className="h-full bg-accent-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* INVISIBLE YOUTUBE PLAYER 
            We inject this when a song falls back to YouTube so that we can bridge controls
        */}
        {currentSong.source === 'youtube' && (
          <iframe
            id="yt-player"
            className="opacity-0 absolute pointer-events-none w-0 h-0"
            src={`https://www.youtube.com/embed/${currentSong.youtube_id}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&controls=0`}
            allow="autoplay; encrypted-media"
          />
        )}

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
              {isPlaying
                ? <Pause className="w-4 h-4 fill-current" />
                : <Play className="w-4 h-4 fill-current translate-x-[1px]" />
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
            {isPlaying
              ? <Pause className="w-7 h-7 fill-current" />
              : <Play className="w-7 h-7 fill-current translate-x-[1px]" />
            }
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
