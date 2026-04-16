'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Clock, TrendingUp, Disc3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SongCard } from '@/components/ui/SongCard'
import { useLibraryStore } from '@/lib/store/library'
import { usePlayerStore } from '@/lib/store/player'
import type { Song } from '@/lib/store/player'

interface Props {
  trendingSongs: Song[]
  newReleaseSongs: Song[]
}

function SectionHeader({ icon: Icon, title, color = 'text-accent-primary' }: { icon: any; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
  )
}

function HorizontalScroll({ songs, queue }: { songs: Song[]; queue: Song[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: -1 | 1) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  return (
    <div className="relative group/scroll">
      <button
        onClick={() => scroll(-1)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-8 h-8 bg-bg-elevated border border-glass-border rounded-full flex items-center justify-center text-white opacity-0 group-hover/scroll:opacity-100 transition-opacity shadow-lg"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {songs.map((song, i) => (
          <div key={song.id} className="flex-shrink-0 w-40 md:w-44 snap-start">
            <SongCard song={song} queue={queue} index={i} />
          </div>
        ))}
      </div>

      <button
        onClick={() => scroll(1)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-8 h-8 bg-bg-elevated border border-glass-border rounded-full flex items-center justify-center text-white opacity-0 group-hover/scroll:opacity-100 transition-opacity shadow-lg"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DiscoveryClient({ trendingSongs, newReleaseSongs }: Props) {
  const { recentlyPlayed } = useLibraryStore()
  const [mounted, setMounted] = useState(false)
  const recentSongs = recentlyPlayed.slice(0, 8).map(e => e.song)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Stable greeting during hydration
  const greeting = useMemo(() => {
    if (!mounted) return 'Welcome back'
    return getGreeting()
  }, [mounted])

  // Random picks: only shuffle after mounting to avoid hydration mismatch
  const aiPicks = useMemo(() => {
    if (!mounted) return trendingSongs.slice(0, 12)
    return [...trendingSongs].sort(() => Math.random() - 0.5).slice(0, 12)
  }, [mounted, trendingSongs])

  // Quick picks: 6 items shown as row cards in a 2x3 grid
  const quickPicks = trendingSongs.slice(0, 6)

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Greeting */}
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-8"
      >
        <h1 className="text-3xl md:text-4xl font-black text-white mb-6">{greeting}</h1>

        {/* Quick picks grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickPicks.map((song, i) => (
            <motion.div
              key={song.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <SongCard song={song} queue={quickPicks} variant="row" index={i} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Recently Played */}
      {recentSongs.length > 0 && (
        <section>
          <SectionHeader icon={Clock} title="Recently Played" />
          <HorizontalScroll songs={recentSongs} queue={recentSongs} />
        </section>
      )}

      {/* Trending */}
      <section>
        <SectionHeader icon={TrendingUp} title="Trending Right Now" color="text-rose-400" />
        <HorizontalScroll songs={trendingSongs} queue={trendingSongs} />
      </section>

      {/* Made For You */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent-primary" />
          </div>
          <h2 className="text-xl font-bold text-white">Made For You</h2>
          <span className="text-[10px] uppercase tracking-widest bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-full border border-accent-primary/20">AI Curation</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {aiPicks.map((song, i) => (
            <SongCard key={`ai-${song.id}`} song={song} queue={trendingSongs} index={i} />
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <SectionHeader icon={Disc3} title="New Releases" color="text-blue-400" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {newReleaseSongs.map((song, i) => (
            <SongCard key={song.id} song={song} queue={newReleaseSongs} index={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
