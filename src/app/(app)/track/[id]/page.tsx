'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Play, Heart, Share2, MoreHorizontal, Clock, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/lib/store/player'
import { useLibraryStore } from '@/lib/store/library'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { ListMusic } from 'lucide-react'
import toast from 'react-hot-toast'
import { JamendoTrack } from '@/lib/jamendo'

// I'll re-fetch metadata because we land here from a link
export default function TrackPage() {
  const { id } = useParams()
  const router = useRouter()
  const [track, setTrack] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { play, currentSong, isPlaying, pause, resume } = usePlayerStore()
  const { toggleLike, isLiked, playlists, addTrackToPlaylist } = useLibraryStore()

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/track/${track?.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      pause()
    } else {
      play(track, [track])
    }
  }

  useEffect(() => {
    async function getTrack() {
      try {
        const trackId = Array.isArray(id) ? id[0] : id
        if (!trackId) return

        // Check if numeric (Jamendo)
        if (/^\d+$/.test(trackId)) {
          const res = await fetch(`https://api.jamendo.com/v3.0/tracks?client_id=${process.env.NEXT_PUBLIC_JAMENDO_CLIENT_ID}&format=json&id=${trackId}&include=musicinfo`)
          const data = await res.json()
          if (data.results && data.results[0]) {
            const song = {
                id: data.results[0].id,
                title: data.results[0].name,
                artist: data.results[0].artist_name,
                album: data.results[0].album_name,
                duration: data.results[0].duration,
                cover_url: data.results[0].image,
                audio_url: data.results[0].audio,
                source: 'jamendo' as const
            }
            setTrack(song)
          }
        } else {
          // Handle YouTube ID if needed, but for now focus on Jamendo
          setTrack(null)
        }
      } catch (e) {
        console.error("Failed to fetch track:", e)
      } finally {
        setLoading(false)
      }
    }
    getTrack()
  }, [id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-secondary animate-pulse">Searching global sounds...</p>
    </div>
  )

  if (!track) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
        <Clock className="w-10 h-10 text-text-muted" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Track not found</h2>
        <p className="text-text-secondary max-w-sm">
          We couldn't find this specific track. It may have been removed or the link is expired.
        </p>
      </div>
      <button 
        onClick={() => router.push('/discovery')}
        className="px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform"
      >
        Back to Home
      </button>
    </div>
  )

  const liked = isLiked(track.id)
  const isCurrentlyPlaying = currentSong?.id === track.id && isPlaying

  return (
    <div className="relative min-h-screen -mt-16 pb-24 overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={track.cover_url} 
          className="w-full h-full object-cover scale-150 blur-[100px] opacity-20"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#121212]/90 to-[#121212]" />
      </div>

      <div className="relative z-10 px-6 pt-24 max-w-5xl mx-auto">
        {/* Back button */}
        <button 
          onClick={() => router.back()}
          className="mb-8 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
          {/* Artwork */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-64 h-64 md:w-72 md:h-72 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden group relative"
          >
            <img src={track.cover_url} className="w-full h-full object-cover" alt={track.title} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button 
                onClick={handlePlay}
                className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center text-black shadow-xl"
               >
                 {isCurrentlyPlaying ? <div className="flex gap-1 items-end h-6"><div className="w-1 bg-black animate-[music-bar_0.5s_ease-in-out_infinite]" /><div className="w-1 bg-black animate-[music-bar_0.7s_ease-in-out_infinite]" /><div className="w-1 bg-black animate-[music-bar_0.6s_ease-in-out_infinite]" /></div> : <Play size={32} fill="currentColor" className="ml-1" />}
               </button>
            </div>
          </motion.div>

          {/* Metadata */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1DB954] mb-2 block">
                Track
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
              {track.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium">
              <span className="text-white hover:underline cursor-pointer">{track.artist}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">{track.album}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/60">{Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-center md:justify-start gap-8 mb-12">
           <button 
            onClick={handlePlay}
            className="px-10 py-3 bg-accent-primary text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(29,185,84,0.3)] flex items-center gap-2"
           >
             {isCurrentlyPlaying ? (
               <>Pause Now</>
             ) : (
               <>Listen Now</>
             )}
           </button>

           <button 
            onClick={() => toggleLike(track)}
            className={`w-12 h-12 rounded-full border border-white/20 flex items-center justify-center transition-all hover:border-white hover:scale-105 ${liked ? 'text-accent-primary' : 'text-white'}`}
           >
             <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
           </button>

           <button 
            onClick={handleShare}
            className="text-white/60 hover:text-white transition-colors"
           >
             <Share2 size={24} />
           </button>

           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-white/60 hover:text-white transition-colors focus:outline-none">
                <MoreHorizontal size={24} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#282828] border-white/10">
              <div className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">Add to Playlist</div>
              {playlists.map(p => (
                <DropdownMenuItem key={p.id} onClick={() => { addTrackToPlaylist(p.id, track); toast.success(`Added to ${p.name}`); }}>
                  <ListMusic className="w-4 h-4 mr-2" />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
              {playlists.length === 0 && (
                <div className="px-3 py-2 text-xs text-text-muted italic">No playlists yet</div>
              )}
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Copy Share Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => play(track, [track])}>
                <Play className="w-4 h-4 mr-2" />
                Play Next
              </DropdownMenuItem>
            </DropdownMenuContent>
           </DropdownMenu>
        </div>

        {/* Info Section */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">About this sounds</h3>
          <p className="text-text-secondary leading-relaxed">
            This track was shared with you on Soundwave. Immerse yourself in the high-fidelity soundscape and explore similar artists from our global library.
          </p>
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary">
               <Clock size={20} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Duration</p>
              <p className="text-text-secondary text-xs">{Math.floor(track.duration / 60)} minutes and {track.duration % 60} seconds</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
