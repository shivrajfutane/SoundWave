'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library } from 'lucide-react'

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Library', href: '/library', icon: Library },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-bg-surface/90 backdrop-blur-lg border-t border-glass-border flex items-center justify-around md:hidden z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-accent-primary' : 'text-text-secondary'}`}
          >
            <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[10px] uppercase tracking-tighter font-bold">{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
