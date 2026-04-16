'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Shuffle, Clock, MoreHorizontal, Trash2 } from 'lucide-react'
import { useLibraryStore } from '@/lib/store/library'
import { usePlayerStore } from '@/lib/store/player'
import { SongCard } from '@/components/ui/SongCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'

export default function PlaylistPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { playlists, deletePlaylist } = useLibraryStore()
  const { play, toggleShuffle, queue, currentSong } = usePlayerStore()

  const playlist = playlists.find(p => p.id === id)

  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-muted mt-20">
        <h2 className="text-2xl font-bold text-white mb-2">Playlist not found</h2>
        <p>This playlist might have been deleted or does not exist.</p>
        <button onClick={() => router.push('/discovery')} className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">
          Go Home
        </button>
      </div>
    )
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length === 0) return
    play(playlist.tracks[0], playlist.tracks)
  }

  const handleShufflePlay = () => {
    if (playlist.tracks.length === 0) return
    toggleShuffle()
    // Start playback at a random track to simulate starting shuffled
    const randomIndex = Math.floor(Math.random() * playlist.tracks.length)
    play(playlist.tracks[randomIndex], playlist.tracks)
  }

  const covers = playlist.tracks.map(t => t.cover_url).filter(Boolean)
  const displayCovers = covers.length > 0 ? covers.slice(0, 4) : ['/placeholder-cover.png']

  return (
    <div className="flex-1 overflow-y-auto bg-black relative">
      {/* Header */}
      <div className="relative pt-24 pb-8 px-6 bg-gradient-to-b from-[#404040] to-black">
        <div className="flex items-end gap-6 relative z-10">
          {/* Collage Cover */}
          <div className="w-52 h-52 shadow-2xl flex-shrink-0 bg-[#282828] overflow-hidden rounded-md">
            {displayCovers.length >= 4 ? (
              <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                {displayCovers.map((c, i) => (
                  <img key={i} src={c} className="w-full h-full object-cover" alt="Playlist cover section" />
                ))}
              </div>
            ) : (
              <img src={displayCovers[0]} className="w-full h-full object-cover" alt={playlist.name} />
            )}
          </div>

          <div className="flex flex-col gap-2 relative top-2">
            <span className="text-sm font-semibold text-white uppercase tracking-wider drop-shadow-md">Playlist</span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter w-full truncate py-1 drop-shadow-lg">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-text-muted mt-2 text-sm">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 mt-4 text-sm text-text-muted">
              <span className="font-semibold text-white">Soundwave User</span>
              <span>•</span>
              <span>{playlist.tracks.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-6 flex items-center gap-6 relative z-10">
        <button 
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className="w-14 h-14 bg-accent-primary rounded-full flex items-center justify-center text-black shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          <Play className="w-6 h-6 fill-current ml-1" />
        </button>
        <button 
          onClick={handleShufflePlay}
          disabled={playlist.tracks.length === 0}
          className="opacity-70 hover:opacity-100 transition-opacity disabled:opacity-30"
          title="Shuffle Play"
        >
          <Shuffle className="w-8 h-8" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-70 hover:opacity-100 transition-opacity ml-2">
              <MoreHorizontal className="w-8 h-8" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
             <DropdownMenuItem 
               onClick={() => { 
                 deletePlaylist(playlist.id)
                 router.replace('/discovery')
               }} 
               className="text-red-400 focus:bg-red-400/10 focus:text-red-300"
             >
               <Trash2 className="w-4 h-4 mr-2" />
               Delete Playlist
             </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Track List */}
      <div className="px-6 pb-8 relative z-10">
        <div className="flex items-center px-4 py-2 border-b border-white/10 text-xs text-text-muted uppercase tracking-wider font-semibold mb-4 mx-[-12px]">
          <div className="w-8">#</div>
          <div className="flex-1">Title</div>
          <div className="w-16 flex justify-end flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col gap-1 mx-[-12px]">
          {playlist.tracks.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              No tracks added yet. Explore and add songs to your playlist!
            </div>
          ) : (
            playlist.tracks.map((track, i) => (
              <SongCard 
                key={`${track.id}-${i}`} 
                song={track} 
                queue={playlist.tracks} 
                variant="row" 
                index={i}
                playlistId={playlist.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
