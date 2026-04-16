'use client'

import { useEffect, useRef } from 'react'
import { initParticles } from '@/lib/microinteractions'

interface FloatingParticlesProps {
  count?: number;
}

export default function FloatingParticles({ count = 30 }: FloatingParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    const cleanup = initParticles(containerRef.current, count)
    
    return () => {
      if (cleanup) cleanup()
    }
  }, [count])

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 overflow-hidden pointer-events-none" 
      aria-hidden="true" 
    />
  )
}
