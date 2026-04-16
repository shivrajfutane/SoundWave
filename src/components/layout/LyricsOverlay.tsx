'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mic2, ExternalLink } from 'lucide-react'
import { usePlayerStore } from '@/lib/store/player'
import { fetchLyrics, extractArtistTitle } from '@/lib/lyrics'
import { Logo } from '../ui/Logo'

export default function LyricsOverlay() {
  const { currentSong, isLyricsOpen, toggleLyrics, lyrics, setLyrics, progress, duration } = usePlayerStore()
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch lyrics when overlay opens
  useEffect(() => {
    if (isLyricsOpen && currentSong) {
      const getLyrics = async () => {
        setLoading(true)
        // If it's YouTube, we need to clean and extract
        let artist = currentSong.artist
        let title = currentSong.title
        
        if (currentSong.source === 'youtube') {
          const extracted = extractArtistTitle(currentSong.title)
          artist = extracted.artist || currentSong.artist
          title = extracted.title
        }

        const res = await fetchLyrics(artist, title)
        setLyrics(res)
        setLoading(false)
      }
      getLyrics()
    }
  }, [isLyricsOpen, currentSong, setLyrics])

  // Parse lyrics (synced from LRCLIB or plain text)
  const parsedLines = useMemo(() => {
    if (!lyrics) return []
    return lyrics.split('\n').map(line => {
      // LRCLIB format: [02:36.21] Text
      const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d{2})?)\](.*)/)
      if (match) {
        const minutes = parseInt(match[1])
        const seconds = parseFloat(match[2])
        return { time: minutes * 60 + seconds, text: match[3].trim() }
      }
      // Return null time for plain lyrics
      return { time: null, text: line.trim() }
    }).filter(l => l.text !== '') // Keep empty texts if they have timestamps, wait no, actually we don't want empty texts
  }, [lyrics])

  const hasTimestamps = useMemo(() => parsedLines.some(l => l.time !== null), [parsedLines])

  // Calculate current line based on progress
  const currentLine = useMemo(() => {
    if (!parsedLines.length) return 0
    
    if (hasTimestamps) {
      let activeIdx = 0
      for (let i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i].time !== null && parsedLines[i].time! <= progress + 0.3) {
          activeIdx = i
        }
      }
      return activeIdx
    }

    // Fallback: distribute lines over duration
    if (!duration) return 0
    const timePerLine = duration / parsedLines.length
    const line = Math.floor(progress / timePerLine)
    return Math.max(0, Math.min(line, parsedLines.length - 1))
  }, [parsedLines, hasTimestamps, progress, duration])

  // Auto-scroll logic
  useEffect(() => {
    if (isLyricsOpen) {
      const activeElement = document.getElementById(`lyric-line-${currentLine}`)
      if (activeElement && scrollRef.current) {
        const container = scrollRef.current
        const elementOffset = activeElement.offsetTop
        const containerHeight = container.offsetHeight
        const targetScroll = elementOffset - (containerHeight / 2) + (activeElement.offsetHeight / 2)
        
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
      }
    }
  }, [currentLine, isLyricsOpen])

  // Keyboard support (ESC to close)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleLyrics(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [toggleLyrics])

  if (!currentSong) return null

  return (
    <AnimatePresence>
      {isLyricsOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[110] bg-black flex flex-col"
        >
          {/* Immersive Background */}
          <div 
            className="absolute inset-0 z-0 opacity-40 blur-[80px] scale-110 pointer-events-none"
            style={{
              backgroundImage: `url(${currentSong.cover_url || '/placeholder-cover.png'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/80 to-black pointer-events-none" />

          {/* Header */}
          <header className="relative z-10 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg shadow-2xl overflow-hidden border border-white/10">
                <img src={currentSong.cover_url || '/placeholder-cover.png'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white font-black text-lg truncate leading-tight">{currentSong.title}</h2>
                <p className="text-white/60 text-sm font-medium">{currentSong.artist}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Brand Pill */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                  <Logo className="w-3 h-3 text-black" />
                </div>
                <span className="text-xs font-black text-white tracking-tight uppercase">Soundwave</span>
              </div>

              <button 
                onClick={() => toggleLyrics(false)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* Lyrics Content */}
          <div 
            ref={scrollRef}
            className="relative z-10 flex-1 overflow-y-auto px-6 md:px-20 py-20 scrollbar-hide select-none"
          >
            <div className="max-w-4xl mx-auto space-y-10 pb-[40vh]">
              {loading ? (
                <div className="flex flex-col items-center justify-center pt-20 gap-4 text-white/40">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-accent-primary rounded-full animate-spin" />
                  <p className="text-sm font-medium animate-pulse">Finding those lyrics...</p>
                </div>
              ) : lyrics ? (
                parsedLines.map((line, index) => (
                  <motion.p
                    key={index}
                    id={`lyric-line-${index}`}
                    onClick={() => {
                      // If it's a synced lyric and user clicks, we can jump to that time!
                      if (line.time !== null) {
                        usePlayerStore.getState().seek(line.time)
                      }
                    }}
                    animate={{
                      opacity: index === currentLine ? 1 : index < currentLine ? 0.3 : 0.4,
                      scale: index === currentLine ? 1.05 : 1,
                      x: index === currentLine ? 10 : 0
                    }}
                    transition={{ duration: 0.4 }}
                    className={`text-3xl md:text-5xl font-black leading-tight tracking-tight transition-colors duration-500 cursor-pointer hover:text-white/80 ${
                      index === currentLine ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-white/30'
                    }`}
                  >
                    {line.text || '...'}
                  </motion.p>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center pt-20 text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <Mic2 className="w-10 h-10 text-white/20" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">No lyrics found</h3>
                    <p className="text-white/40 max-w-sm mx-auto">We couldn't find the lyrics for this track Automatically. Try searching on Google.</p>
                  </div>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${currentSong.artist} ${currentSong.title} lyrics`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full text-white font-bold hover:bg-white/20 transition-all border border-white/5"
                  >
                    Search Manually <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Footer controls hint */}
          <div className="relative z-10 p-10 flex justify-center pointer-events-none">
            <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-md text-[10px] uppercase font-black tracking-[0.2em] text-white/30 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasTimestamps ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`} />
              {hasTimestamps ? 'Perfectly synced via LRCLIB' : 'Synced with estimated timing'}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
