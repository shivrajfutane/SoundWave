'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Heart, MoreHorizontal, Plus, ListMusic, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore, Song } from '@/lib/store/player'
import { useLibraryStore } from '@/lib/store/library'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import toast from 'react-hot-toast'

interface SongCardProps {
  song: Song
  queue?: Song[]
  onClick?: () => void
  /** Compact list-row style instead of card grid */
  variant?: 'card' | 'row'
  index?: number
  /** If rendered inside a playlist, provide the ID to enable removal */
  playlistId?: string
}

export function SongCard({ song, queue, onClick, variant = 'card', index, playlistId }: SongCardProps) {
  const { play, currentSong, isPlaying, pause, resume } = usePlayerStore()
  const { toggleLike, isLiked, playlists, addTrackToPlaylist, removeTrackFromPlaylist } = useLibraryStore()
  const liked = isLiked(song.id)
  const isCurrentSong = currentSong?.id === song.id
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/track/${song.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied')
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentSong) {
      isPlaying ? pause() : resume()
    } else {
      play(song, queue ?? [song])
    }
    onClick?.()
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleLike(song)
  }

  if (variant === 'row') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: (index ?? 0) * 0.04 }}
        className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-white/[0.06] ${
          isCurrentSong ? 'bg-accent-primary/10' : ''
        }`}
        onClick={handlePlay}
      >
        {/* Track number / play indicator */}
        <div className="w-8 flex items-center justify-center flex-shrink-0">
          {isCurrentSong && isPlaying ? (
            <motion.div className="flex items-end gap-[2px] h-4" animate={{ opacity: 1 }}>
              {[0.6, 1, 0.4].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-accent-primary rounded-full"
                  animate={{ scaleY: [h, 1, h] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  style={{ height: 16, originY: 1 }}
                />
              ))}
            </motion.div>
          ) : (
            <>
              <span className="text-text-muted text-sm group-hover:hidden font-mono">
                {index !== undefined ? index + 1 : ''}
              </span>
              <Play className="w-4 h-4 text-text-primary fill-current hidden group-hover:block" />
            </>
          )}
        </div>

        {/* Cover */}
        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 shadow-md">
          <img
            src={song.cover_url || '/placeholder-cover.png'}
            alt={song.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isCurrentSong ? 'text-accent-primary' : 'text-text-primary'}`}>
            {song.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-text-secondary truncate">{song.artist}</p>
            <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/5">
              {song.source === 'youtube' ? 'Official Audio' : song.source === 'jamendo' ? 'Free Track' : 'Song'}
            </span>
          </div>
        </div>

        {/* Duration + Like */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.8 }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity ${mounted && liked ? 'opacity-100 text-accent-primary' : 'text-text-muted hover:text-text-primary'}`}
            title={mounted && liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          >
            <Heart className={`w-4 h-4 ${mounted && liked ? 'fill-current' : ''}`} />
          </motion.button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.8 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-white p-1"
                title="Add to Playlist"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Add to Playlist</div>
              {playlists.length === 0 && (
                <div className="px-2 py-1 text-xs text-text-muted italic">No playlists yet</div>
              )}
              {playlists.map(p => (
                <DropdownMenuItem 
                  key={p.id} 
                  onClick={(e) => { e.stopPropagation(); addTrackToPlaylist(p.id, song); }}
                >
                  <ListMusic className="w-4 h-4 mr-2" />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-text-muted text-xs font-mono w-10 text-right">
            {song.duration ? `${Math.floor(song.duration / 60)}:${String(Math.floor(song.duration % 60)).padStart(2, '0')}` : '—'}
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()} 
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-white transition-opacity p-2 -mr-2"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              {playlistId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); removeTrackFromPlaylist(playlistId, song.id); toast.success('Removed from playlist'); }}
                    className="text-red-400 focus:text-red-300 focus:bg-red-400/10"
                  >
                    Remove from Playlist
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    )
  }

  // Card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index ?? 0) * 0.05 }}
      className={`group relative p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-transparent hover:border-white/[0.08] transition-all duration-300 cursor-pointer flex flex-col gap-4 ${
        isCurrentSong ? 'border-accent-primary/30 bg-accent-primary/5' : ''
      }`}
      onClick={handlePlay}
      whileHover={{ y: -2 }}
    >
      {/* Cover art */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden shadow-lg">
        <img
          src={song.cover_url || '/placeholder-cover.png'}
          alt={song.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

        {/* Play button */}
        <AnimatePresence mode="wait">
          {isCurrentSong && isPlaying ? (
            <motion.button
              key="pause"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-2 right-2 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(29,185,84,0.5)] hover:scale-110 transition-transform"
              onClick={handlePlay}
            >
              <Pause className="w-5 h-5 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              key="play"
              initial={{ opacity: 0, scale: 0.8, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 8 }}
              className="absolute bottom-2 right-2 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(29,185,84,0.5)] hover:scale-110 transition-transform
                         opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
              onClick={handlePlay}
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Currently playing equalizer */}
        {isCurrentSong && isPlaying && (
          <div className="absolute top-2 left-2 flex items-end gap-[2px] bg-black/50 rounded px-1.5 py-1">
            {[0.6, 1, 0.4, 0.8].map((h, i) => (
              <motion.div
                key={i}
                className="w-[3px] bg-accent-primary rounded-full"
                animate={{ scaleY: [h, 1, h] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                style={{ height: 12, originY: 1 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Song info */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`text-sm font-semibold truncate ${isCurrentSong ? 'text-accent-primary' : 'text-text-primary'}`}>
              {song.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-text-secondary truncate">{song.artist}</p>
              <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/5">
                {song.source === 'youtube' ? 'Official Audio' : song.source === 'jamendo' ? 'Free Track' : 'Song'}
              </span>
            </div>
          </div>

          {/* Like button */}
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.75 }}
            animate={{ scale: mounted && liked ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={`flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 ${mounted && liked ? 'opacity-100 text-accent-primary' : 'text-text-muted hover:text-text-primary'} transition-all`}
            aria-label={mounted && liked ? 'Remove from liked songs' : 'Add to liked songs'}
            title={mounted && liked ? 'Unlike' : 'Like'}
          >
            <Heart className={`w-4 h-4 ${mounted && liked ? 'fill-current' : ''}`} />
          </motion.button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.75 }}
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-white transition-all ml-1"
                aria-label="Add to playlist"
                title="Add to Playlist"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="w-4 h-4" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Add to Playlist</div>
              {playlists.length === 0 && (
                <div className="px-2 py-1 text-xs text-text-muted italic">No playlists yet</div>
              )}
              {playlists.map(p => (
                <DropdownMenuItem 
                  key={p.id} 
                  onClick={(e) => { e.stopPropagation(); addTrackToPlaylist(p.id, song); }}
                >
                  <ListMusic className="w-4 h-4 mr-2" />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={(e) => e.stopPropagation()} 
                className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-white transition-all ml-1"
                title="More"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              {playlistId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); removeTrackFromPlaylist(playlistId, song.id); toast.success('Removed from playlist'); }}
                    className="text-red-400 focus:text-red-300 focus:bg-red-400/10"
                  >
                    Remove from Playlist
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}
