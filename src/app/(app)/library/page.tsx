'use client'

import { useState } from 'react'
import { Heart, Clock, Play, Shuffle, ListMusic } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '@/lib/store/library'
import { usePlayerStore } from '@/lib/store/player'
import { SongCard } from '@/components/ui/SongCard'
import Link from 'next/link'

const TABS = ['Liked Songs', 'Playlists', 'Recently Played'] as const
type Tab = typeof TABS[number]

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Liked Songs')
  const { likedSongs, recentlyPlayed, playlists } = useLibraryStore()
  const { play } = usePlayerStore()

  const songs = activeTab === 'Liked Songs'
    ? likedSongs
    : recentlyPlayed.map(e => e.song)

  const playAll = () => {
    if (songs.length === 0) return
    play(songs[0], songs)
  }

  const shuffleAll = () => {
    if (songs.length === 0) return
    const shuffled = [...songs].sort(() => Math.random() - 0.5)
    play(shuffled[0], shuffled)
  }

  return (
    <div className="flex flex-col gap-0 pb-10 min-h-full">
      {/* Hero header */}
      <section
        className="relative pt-16 pb-8 px-0 flex flex-col md:flex-row items-start md:items-end gap-6 overflow-hidden"
        style={{
          background: activeTab === 'Liked Songs'
            ? 'linear-gradient(to bottom, rgba(64,0,104,0.8) 0%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(15,70,50,0.8) 0%, transparent 100%)',
          transition: 'background 0.5s ease',
        }}
      >
        {/* Artwork */}
        <motion.div
          layout
          className="w-44 h-44 md:w-52 md:h-52 rounded-xl flex items-center justify-center shadow-2xl flex-shrink-0"
          style={{
            background: activeTab === 'Liked Songs'
              ? 'linear-gradient(135deg, #450af5, #c4efd9)'
              : 'linear-gradient(135deg, #1DB954, #0a4d2e)',
          }}
        >
          {activeTab === 'Liked Songs'
            ? <Heart className="w-20 h-20 text-white fill-white drop-shadow" />
            : <Clock className="w-20 h-20 text-white drop-shadow" />
          }
        </motion.div>

        {/* Meta */}
        <div className="pb-2">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2">Library Hub</p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3 text-white drop-shadow-lg">
            {activeTab}
          </h1>
          {activeTab !== 'Playlists' ? (
            <p className="text-white/60 text-sm">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          ) : (
            <p className="text-white/60 text-sm">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </p>
          )}
        </div>
      </section>

      {/* Controls row */}
      {activeTab !== 'Playlists' && (
      <div className="flex items-center gap-4 py-6">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={playAll}
          disabled={songs.length === 0}
          className="w-14 h-14 bg-accent-primary rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(29,185,84,0.35)] hover:scale-105 transition-transform disabled:opacity-40"
        >
          <Play className="w-6 h-6 fill-current ml-0.5" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={shuffleAll}
          disabled={songs.length === 0}
          className="text-text-secondary hover:text-white transition-colors disabled:opacity-40"
          title="Shuffle"
        >
          <Shuffle className="w-8 h-8" />
        </motion.button>
      </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 px-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-black'
                : 'bg-white/10 text-text-secondary hover:bg-white/20 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Track list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Playlists' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-1">
              {playlists.length === 0 ? (
                <div className="col-span-full py-12 text-center text-text-muted">
                  <ListMusic className="w-14 h-14 mb-4 mx-auto opacity-20" />
                  <p className="text-xl font-semibold text-white mb-2">No custom playlists</p>
                  <p className="text-sm">Click the + icon in the sidebar to create your first playlist.</p>
                </div>
              ) : (
                playlists.map(playlist => (
                  <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group p-4 bg-white/[0.03] hover:bg-white/[0.08] transition-colors rounded-xl border border-transparent hover:border-white/10 cursor-pointer flex flex-col gap-3"
                    >
                      <div className="aspect-square bg-gradient-to-br from-[#1DB954] to-[#450af5] rounded-md flex items-center justify-center shadow-lg relative overflow-hidden">
                        {playlist.tracks.length > 0 && playlist.tracks[0]?.cover_url ? (
                           <img src={playlist.tracks[0].cover_url} className="w-full h-full object-cover" />
                        ) : (
                           <ListMusic className="w-12 h-12 text-white/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-white truncate">{playlist.name}</h3>
                        <p className="text-xs text-text-muted mt-1">{playlist.tracks.length} tracks</p>
                      </div>
                    </motion.div>
                  </Link>
                ))
              )}
            </div>
          ) : songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-text-muted">
              {activeTab === 'Liked Songs'
                ? <Heart className="w-14 h-14 mb-4 opacity-20" />
                : <Clock className="w-14 h-14 mb-4 opacity-20" />
              }
              <p className="text-xl font-semibold text-white mb-2">
                {activeTab === 'Liked Songs' ? 'No liked songs yet' : 'Nothing played yet'}
              </p>
              <p className="text-sm text-center max-w-xs">
                {activeTab === 'Liked Songs'
                  ? 'Click the ♥ icon on any song to save it here.'
                  : 'Start listening — your history will appear here.'
                }
              </p>
            </div>
          ) : (
            /* Table header */
            <div className="flex flex-col">
              <div className="grid grid-cols-[32px_1fr_auto] md:grid-cols-[32px_1fr_auto] gap-4 px-3 py-2 border-b border-white/[0.08] mb-1 text-text-muted text-xs uppercase tracking-widest font-bold">
                <span className="text-center">#</span>
                <span>Title</span>
                <span className="pr-2">Duration</span>
              </div>
              {songs.map((song, i) => (
                <SongCard
                  key={`${song.id}-${i}`}
                  song={song}
                  queue={songs}
                  variant="row"
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
