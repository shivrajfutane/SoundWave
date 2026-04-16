'use client'

import { useEffect } from 'react'
import { Home, Search, Library, Heart, Clock, Music2, Plus, ListMusic, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLibraryStore } from '@/lib/store/library'
import { useUIStore } from '@/lib/store/ui'
import { usePlayerStore } from '@/lib/store/player'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

const navItems = [
  { name: 'Home', href: '/discovery', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { likedSongs, recentlyPlayed, playlists, user, setUser } = useLibraryStore()
  const { setPlaylistModalOpen } = useUIStore()
  const { play } = usePlayerStore()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar_url: session.user.user_metadata.avatar_url,
        })
      }
    }
    fetchUser()

    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          avatar_url: session.user.user_metadata.avatar_url,
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <aside className="w-[var(--sidebar-width)] h-full bg-black flex flex-col hidden md:flex shrink-0">
      {/* Logo */}
      <Link 
        href="/discovery" 
        className="px-6 pt-6 pb-4 flex items-center gap-3 group/logo cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl bg-accent-primary shadow-[0_0_20px_rgba(29,185,84,0.35)] flex items-center justify-center flex-shrink-0 group-hover/logo:scale-110 transition-all duration-300">
          <Logo className="w-6 h-6 text-black" />
        </div>
        <span className="font-black text-xl text-white tracking-tight">Soundwave</span>
      </Link>

      {/* Primary Nav */}
      <nav className="px-3 mb-2">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive ? 'text-white bg-white/10' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent-primary rounded-full"
                />
              )}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              <span className="font-semibold text-sm">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Library section */}
      <div className="px-3 flex-1 flex flex-col gap-1 mt-4 overflow-y-auto min-h-0 pb-4">
        <div className="px-3 mb-3 flex items-center justify-between">
          <span className="text-[#b3b3b3] font-bold text-sm uppercase tracking-wider">Your Library</span>
          <button 
            onClick={() => setPlaylistModalOpen(true)}
            className="text-[#b3b3b3] hover:text-white hover:bg-white/[0.06] p-1 rounded-full transition-colors"
            title="Create Playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Liked Songs */}
        <Link
          href="/library"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
            pathname === '/library' ? 'text-white bg-white/10' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
          }`}
        >
          <div className="w-9 h-9 rounded bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center flex-shrink-0 shadow-md">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-inherit">Liked Songs</p>
            <p className="text-xs text-[#b3b3b3]">
              {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
          {likedSongs.length > 0 && (
            <AnimatePresence>
              <motion.span
                key={likedSongs.length}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto text-xs bg-accent-primary text-black rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0"
              >
                {likedSongs.length > 9 ? '9+' : likedSongs.length}
              </motion.span>
            </AnimatePresence>
          )}
        </Link>

        {/* Recently Played */}
        <Link
          href="/library"
          onClick={() => {}} // tab switching would require query param
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]`}
        >
          <div className="w-9 h-9 rounded bg-gradient-to-br from-[#1DB954] to-[#0a4d2e] flex items-center justify-center flex-shrink-0 shadow-md">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-inherit">Recently Played</p>
            <p className="text-xs text-[#b3b3b3]">{recentlyPlayed.length} tracks</p>
          </div>
        </Link>

        {/* Custom Playlists */}
        {playlists.map(playlist => (
          <Link
            key={playlist.id}
            href={`/playlist/${playlist.id}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
              pathname === `/playlist/${playlist.id}` ? 'text-white bg-white/10' : 'text-[#b3b3b3] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <div className="w-9 h-9 rounded bg-white/[0.05] flex items-center justify-center flex-shrink-0 shadow-md">
              <ListMusic className="w-4 h-4 text-[#b3b3b3] group-hover:text-white transition-colors" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-inherit transition-colors">{playlist.name}</p>
              <p className="text-xs text-[#b3b3b3] truncate">{playlist.tracks.length} tracks</p>
            </div>
          </Link>
        ))}

        {/* Divider */}
        {likedSongs.length > 0 && (
          <div className="mt-3 px-3">
            <div className="h-px bg-white/[0.08]" />
            <p className="text-xs text-[#b3b3b3] font-bold uppercase tracking-wider mt-3 mb-1">Recently Liked</p>
            <div className="flex flex-col gap-0.5">
              {likedSongs.slice(0, 3).map(song => (
                <div 
                  key={song.id} 
                  onClick={() => play(song, likedSongs)}
                  className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/[0.05] transition-colors cursor-pointer group/item"
                >
                  <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0">
                    <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#b3b3b3] group-hover/item:text-white truncate transition-colors">{song.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="mt-auto px-4 py-4 border-t border-white/[0.08]">
        {user ? (
          <Link 
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-accent-primary flex-shrink-0 flex items-center justify-center">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <Logo className="w-5 h-5 text-black" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-accent-primary transition-colors">{user.name}</p>
            </div>
          </Link>
        ) : (
          <div className="p-3 bg-white/[0.05] rounded-xl border border-white/[0.08]">
            <p className="text-xs text-[#b3b3b3] mb-3">Sign in to save your discovered tracks and playlists.</p>
            <button 
              onClick={() => useUIStore.getState().openAuthModal()}
              className="w-full py-2 bg-white text-black font-bold text-xs rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
