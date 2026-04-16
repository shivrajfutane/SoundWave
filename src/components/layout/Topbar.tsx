'use client'

import { useEffect, useState } from 'react'
import { Search, LogIn, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { animateRipple } from '@/lib/microinteractions'
import { useUIStore } from '@/lib/store/ui'
import { createClient } from '@/lib/supabase/client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'

export default function Topbar() {
  const router = useRouter()
  const { openAuthModal } = useUIStore()
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    const supabase = createClient()
    
    // Initial fetch
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleInteraction = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    animateRipple(e.currentTarget, e.clientX - rect.left, e.clientY - rect.top)
    openAuthModal('signin')
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="h-[var(--topbar-height)] px-4 md:px-6 flex items-center justify-between bg-bg-base/80 backdrop-blur-md sticky top-0 z-40 border-b border-glass-border/50">
      <Link href="/discovery" className="flex md:hidden items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-full bg-accent-primary shadow-glow flex items-center justify-center text-black font-bold text-lg leading-none">S</div>
      </Link>

      <div className="flex-1 flex max-w-sm">
        <div className="relative w-full group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors group-focus-within:text-text-primary" />
          <input
            type="text"
            placeholder="What do you want to listen to?"
            onClick={() => router.push('/search')}
            readOnly
            className="w-full bg-glass-bg border border-glass-border rounded-full py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-glass-border-hover focus:bg-glass-bg-hover transition-all cursor-pointer"
          />
        </div>
        
        {/* Mobile Search Trigger */}
        <button 
          onClick={() => router.push('/search')}
          className="md:hidden flex items-center justify-center p-2 text-text-secondary"
        >
          <Search className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-9 w-9 border-2 border-transparent hover:border-white/20 transition-all cursor-pointer">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt={user.email} />
                <AvatarFallback>
                  <User className="w-4 h-4 text-black" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mt-2">
              <DropdownMenuItem className="opacity-70 text-xs py-2 pointer-events-none break-all">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                Account
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-400 focus:text-red-300" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button 
            onMouseDown={handleInteraction}
            className="flex items-center justify-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-text-primary text-black font-semibold rounded-full hover:scale-105 transition-transform overflow-hidden relative shadow-glow"
          >
            <LogIn className="w-4 h-4 md:w-4 md:h-4" />
            <span className="text-xs md:text-sm">Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}
