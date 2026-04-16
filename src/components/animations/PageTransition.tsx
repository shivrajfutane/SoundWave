'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { animatePageEnter } from '@/lib/animations'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      animatePageEnter(containerRef.current!)
    }, containerRef)

    return () => ctx.revert()
  }, [pathname]) // Re-run animation on route change

  return (
    <div ref={containerRef} className="opacity-0">
      {children}
    </div>
  )
}
