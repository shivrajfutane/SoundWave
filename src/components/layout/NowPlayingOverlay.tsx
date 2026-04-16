'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  Volume2,
  Maximize2
} from 'lucide-react'
import { usePlayerStore } from '@/lib/store/player'
import { Slider } from '../ui/Slider'
import { Button } from '../ui/Button'

export default function NowPlayingOverlay() {
  const { 
    currentSong, 
    isPlaying, 
    isNowPlayingOpen, 
    toggleNowPlaying,
    pause,
    resume,
    next,
    previous,
    progress,
    duration,
    seek,
    volume,
    setVolume,
    repeatMode,
    toggleRepeat,
    isShuffled,
    toggleShuffle,
    lyrics
  } = usePlayerStore()

  // We now use the global lyrics state from the store
  const loadingLyrics = false // Fetched by LyricsOverlay or a global trigger

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentSong) return null

  return (
    <AnimatePresence>
      {isNowPlayingOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden"
        >
          {/* Background Gradient */}
          <div 
            className="absolute inset-0 transition-all duration-1000 opacity-40 blur-[100px] -z-10 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: `url(${currentSong.cover_url})` }}
          />
          <div className="absolute inset-0 bg-black/60 -z-10" />

          {/* Header */}
          <header className="flex items-center justify-between px-6 py-6 md:px-10">
            <button 
              onClick={() => toggleNowPlaying(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            >
              <ChevronDown className="w-8 h-8" />
            </button>
            <div className="text-center">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-white/60">Playing from Album</p>
              <p className="text-xs md:text-sm font-bold text-white truncate max-w-[200px]">{currentSong.album || currentSong.title}</p>
            </div>
            <div className="w-12 h-12" /> {/* Spacer */}
          </header>

          <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-20 gap-10 md:gap-20 overflow-y-auto pb-10">
            {/* Left Portion: Artwork & Info */}
            <div className="w-full max-w-[320px] md:max-w-[440px] flex flex-col items-start gap-8 shrink-0">
              <motion.div 
                layoutId={`artwork-${currentSong.id}`}
                className="w-full aspect-square rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden bg-white/5"
              >
                <img 
                  src={currentSong.cover_url} 
                  alt={currentSong.title} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              <div className="w-full">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 leading-tight line-clamp-2 overflow-hidden break-words">
                  {currentSong.title}
                </h1>
                <p className="text-lg md:text-xl text-white/60 font-medium truncate">{currentSong.artist}</p>
              </div>

              {/* Progress Bar and Main Controls inside left side for desktop feel */}
              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <Slider 
                    value={[progress]} 
                    max={duration || 100} 
                    step={1}
                    onValueChange={([val]) => seek(val)}
                    className="w-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] md:text-xs font-bold text-white/60 font-mono">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button 
                    onClick={toggleShuffle}
                    className={`transition-colors p-2 ${isShuffled ? 'text-accent-primary' : 'text-white/40 hover:text-white'}`}
                  >
                    <Shuffle className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <button onClick={previous} className="text-white hover:scale-110 transition-transform p-2">
                    <SkipBack className="w-7 h-7 md:w-9 md:h-9 fill-current" />
                  </button>
                  <button 
                    onClick={isPlaying ? pause : resume}
                    className="w-14 h-14 md:w-20 md:h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 md:w-10 md:h-10 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 md:w-10 md:h-10 fill-current translate-x-0.5" />
                    )}
                  </button>
                  <button onClick={next} className="text-white hover:scale-110 transition-transform p-2">
                    <SkipForward className="w-7 h-7 md:w-9 md:h-9 fill-current" />
                  </button>
                  <button 
                    onClick={toggleRepeat}
                    className={`transition-colors p-2 ${repeatMode !== 'off' ? 'text-accent-primary' : 'text-white/40 hover:text-white'}`}
                  >
                    <Repeat className="w-5 h-5 md:w-6 md:h-6" />
                    {repeatMode === 'one' && <span className="absolute text-[8px] font-bold mt-[-10px] ml-[10px]">1</span>}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Portion: Lyrics */}
            <div className="w-full max-w-[500px] flex flex-col h-full max-h-[400px] md:max-h-[600px]">
              <div className="px-1 mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Lyrics</h2>
              </div>
              <div className="flex-1 bg-white/5 md:bg-transparent rounded-2xl p-6 md:p-0 overflow-y-auto custom-scrollbar">
                {loadingLyrics ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-6 bg-white/5 rounded-full animate-pulse mr-4" style={{ width: `${80 + Math.random() * 20}%` }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xl md:text-2xl font-bold text-white/90 whitespace-pre-wrap leading-relaxed">
                    {lyrics || "Lyrics aren't available for this song yet."}
                  </p>
                )}
              </div>
            </div>
          </main>

          {/* Footer Controls (Volume etc) */}
          <footer className="px-6 py-8 md:px-10 flex items-center justify-between hidden md:flex">
             <div className="flex items-center gap-2 w-32 group">
                <Volume2 className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                <Slider 
                  value={[volume]} 
                  max={1} 
                  step={0.01}
                  onValueChange={([val]) => setVolume(val)}
                  className="w-full"
                />
             </div>
             
             <div className="flex items-center gap-6">
                <button className="text-white/40 hover:text-white transition-colors">
                  <Maximize2 className="w-5 h-5" />
                </button>
             </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
