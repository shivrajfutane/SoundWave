'use client'

import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Player from './Player'
import { usePlayerStore } from '@/lib/store/player'
import MobileNav from './MobileNav'
import NowPlayingOverlay from './NowPlayingOverlay'
import PageTransition from '../animations/PageTransition'
import LyricsOverlay from './LyricsOverlay'
import { AuthModal } from '../auth/AuthModal'
import { CreatePlaylistModal } from '../ui/CreatePlaylistModal'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isNowPlayingOpen, isLyricsOpen } = usePlayerStore()
  const isOverlayOpen = isNowPlayingOpen || isLyricsOpen

  return (
    <div className="flex h-screen bg-bg-base text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Topbar />
        <main 
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-[calc(var(--player-height)+24px)] md:pb-36" 
          id="main-scroll-area"
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <Player />
      {!isOverlayOpen && <MobileNav />}
      <NowPlayingOverlay />
      <LyricsOverlay />
      <AuthModal />
      <CreatePlaylistModal />
    </div>
  )
}
