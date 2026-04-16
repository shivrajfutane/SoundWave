'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { 
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Volume2,
  Sparkles, Search, Brain, Radio, Music2, Headphones, Heart,
  ChevronRight, Code2, Mail, Info, Mic, Send, Zap, Wand2
} from 'lucide-react'

// ─────────────────────────────────────────────
//  ANIMATED WAVEFORM BACKGROUND
// ─────────────────────────────────────────────
function WaveformBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      time += 0.008
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let wave = 0; wave < 4; wave++) {
        ctx.beginPath()
        const amplitude = 30 + wave * 15
        const frequency = 0.003 + wave * 0.001
        const yOffset = canvas.height * 0.55 + wave * 25
        const alpha = 0.06 - wave * 0.012

        for (let x = 0; x < canvas.width; x++) {
          const y = yOffset + Math.sin(x * frequency + time + wave * 0.8) * amplitude
            + Math.sin(x * frequency * 2 + time * 1.3) * (amplitude * 0.3)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.strokeStyle = `rgba(29, 185, 84, ${alpha})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      aria-hidden="true" 
    />
  )
}

// ─────────────────────────────────────────────
//  GLOW ORB (ambient background decoration)
// ─────────────────────────────────────────────
function GlowOrb({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} aria-hidden="true" />
  )
}

// ─────────────────────────────────────────────
//  ANIMATED COUNTER
// ─────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const duration = 2000
          const startTime = Date.now()
          const tick = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          tick()
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─────────────────────────────────────────────
//  MOCK PLAYER UI (hero section decoration)
// ─────────────────────────────────────────────
function MockPlayer() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(42)

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress(p => (p >= 100 ? 0 : p + 0.3))
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow behind player */}
      <div className="absolute -inset-4 bg-accent-primary/10 rounded-3xl blur-2xl" />
      
      <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
        {/* Album art */}
        <div className="relative aspect-square rounded-xl overflow-hidden mb-5 shadow-xl group">
          <img 
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop" 
            alt="Album cover" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {/* Floating equalizer bars */}
          <div className="absolute bottom-3 left-3 flex items-end gap-[3px]">
            {[0.6, 1, 0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
              <div 
                key={i}
                className="w-[3px] bg-accent-primary rounded-full origin-bottom"
                style={{ 
                  height: `${h * 24}px`,
                  animation: isPlaying ? `eq-bar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
                  opacity: isPlaying ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Song info */}
        <div className="mb-4">
          <h4 className="text-white font-semibold text-base truncate">Midnight Frequencies</h4>
          <p className="text-white/50 text-sm truncate">Neon Pulse · Synthwave Dreams</p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-primary rounded-full transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mt-1 font-mono">
            <span>1:{Math.floor(progress / 100 * 60).toString().padStart(2, '0')}</span>
            <span>3:42</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-5">
          <button className="text-white/40 hover:text-white/70 transition-colors"><Shuffle className="w-4 h-4" /></button>
          <button className="text-white/60 hover:text-white transition-colors"><SkipBack className="w-5 h-5 fill-current" /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-black hover:scale-105 hover:bg-accent-primary-hover transition-all shadow-[0_0_30px_rgba(29,185,84,0.3)]"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button className="text-white/60 hover:text-white transition-colors"><SkipForward className="w-5 h-5 fill-current" /></button>
          <button className="text-white/40 hover:text-white/70 transition-colors"><Repeat className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  FEATURE CARD
// ─────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, delay }: { icon: any; title: string; description: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div 
      ref={ref}
      className={`group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 group-hover:scale-110 transition-all duration-300">
        <Icon className="w-6 h-6 text-accent-primary" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{description}</p>
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-accent-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}

// ─────────────────────────────────────────────
//  AI DEMO SECTION
// ─────────────────────────────────────────────
const AI_PLAYLISTS: Record<string, { title: string; artist: string; cover: string; mood: string }[]> = {
  'chill': [
    { title: 'Ocean Waves', artist: 'Ambient Flow', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop', mood: '🌊' },
    { title: 'Sunset Drive', artist: 'LoFi Dreams', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=300&auto=format&fit=crop', mood: '🌅' },
    { title: 'Rainy Café', artist: 'Jazz & Rain', cover: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=300&auto=format&fit=crop', mood: '☕' },
    { title: 'Starlit Night', artist: 'Deep Space', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=300&auto=format&fit=crop', mood: '✨' },
  ],
  'energy': [
    { title: 'Thunder Road', artist: 'Electric Storm', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop', mood: '⚡' },
    { title: 'Adrenaline Rush', artist: 'Bass Nation', cover: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=300&auto=format&fit=crop', mood: '🔥' },
    { title: 'Neon Nights', artist: 'Synth Riders', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop', mood: '🎆' },
    { title: 'Run the World', artist: 'Power Pulse', cover: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=300&auto=format&fit=crop', mood: '💪' },
  ],
  'focus': [
    { title: 'Deep Concentration', artist: 'Mind Flow', cover: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=300&auto=format&fit=crop', mood: '🧠' },
    { title: 'Piano Studies', artist: 'Classical Focus', cover: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=300&auto=format&fit=crop', mood: '🎹' },
    { title: 'White Noise Garden', artist: 'Nature Sounds', cover: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=300&auto=format&fit=crop', mood: '🌿' },
    { title: 'Alpha Waves', artist: 'Binaural Beats', cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop', mood: '🔮' },
  ],
}

const PROMPTS = [
  'Play something chill',
  'I need energy for my workout',
  'Help me focus while coding',
]

function AiDemo() {
  const [input, setInput] = useState('')
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [playlist, setPlaylist] = useState<typeof AI_PLAYLISTS['chill'] | null>(null)
  const [typingText, setTypingText] = useState('')

  const generatePlaylist = (prompt: string) => {
    setInput(prompt)
    setIsThinking(true)
    setPlaylist(null)
    setActivePrompt(prompt)
    setTypingText('')

    // Determine mood from prompt
    const lower = prompt.toLowerCase()
    let mood: 'chill' | 'energy' | 'focus' = 'chill'
    if (lower.includes('energy') || lower.includes('workout') || lower.includes('pump') || lower.includes('hype')) mood = 'energy'
    else if (lower.includes('focus') || lower.includes('study') || lower.includes('coding') || lower.includes('work')) mood = 'focus'

    const responseText = mood === 'chill'
      ? "Here's a chill playlist to help you unwind 🎧"
      : mood === 'energy'
      ? "Let's get your blood pumping! 🔥"
      : "Deep focus mode activated 🧠"

    // Simulate AI thinking
    setTimeout(() => {
      setIsThinking(false)
      // Typewriter effect
      let i = 0
      const typeInterval = setInterval(() => {
        setTypingText(responseText.slice(0, i + 1))
        i++
        if (i >= responseText.length) {
          clearInterval(typeInterval)
          setTimeout(() => setPlaylist(AI_PLAYLISTS[mood]), 300)
        }
      }, 30)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 md:p-10 shadow-2xl overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.3)]">
            <Wand2 className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Soundwave AI</h3>
            <p className="text-white/40 text-xs">Powered by mood detection engine</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold uppercase tracking-wider">Live Demo</span>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PROMPTS.map(prompt => (
            <button
              key={prompt}
              onClick={() => generatePlaylist(prompt)}
              className={`px-4 py-2 rounded-full text-sm border transition-all duration-300 ${
                activePrompt === prompt 
                  ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary' 
                  : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]'
              }`}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="relative mb-6">
          <Mic className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && input.trim()) generatePlaylist(input) }}
            placeholder="Tell me what you're in the mood for..."
            className="w-full h-14 pl-12 pr-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-accent-primary/40 focus:bg-white/[0.07] transition-all text-sm"
          />
          <button 
            onClick={() => { if (input.trim()) generatePlaylist(input) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-black hover:bg-accent-primary-hover transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* AI Response */}
        {(isThinking || typingText) && (
          <div className="mb-6 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div className="flex-1">
              {isThinking ? (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Analyzing your mood...
                </div>
              ) : (
                <p className="text-white/80 text-sm">{typingText}<span className="inline-block w-0.5 h-4 bg-accent-primary ml-0.5 animate-pulse" /></p>
              )}
            </div>
          </div>
        )}

        {/* Generated Playlist */}
        {playlist && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {playlist.map((track, i) => (
              <div 
                key={track.title}
                className="group bg-white/[0.04] rounded-xl p-3 hover:bg-white/[0.08] transition-all duration-300 cursor-pointer hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 shadow-md">
                  <img src={track.cover} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                  </div>
                  <span className="absolute top-2 right-2 text-lg">{track.mood}</span>
                </div>
                <p className="text-white text-sm font-medium truncate">{track.title}</p>
                <p className="text-white/40 text-xs truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
//  TRENDING ALBUM CARD
// ─────────────────────────────────────────────
const TRENDING_ALBUMS = [
  { title: 'After Hours', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c12?q=80&w=400&auto=format&fit=crop' },
  { title: 'Future Nostalgia', artist: 'Dua Lipa', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop' },
  { title: 'Midnight Rain', artist: 'Neon Pulse', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop' },
  { title: 'Cosmic Drift', artist: 'Astral Echo', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=400&auto=format&fit=crop' },
  { title: 'Electric Soul', artist: 'Voltage', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop' },
  { title: 'Golden Hour', artist: 'Sun Chaser', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=400&auto=format&fit=crop' },
  { title: 'Deep Blue', artist: 'Ocean Mind', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop' },
  { title: 'Neon Streets', artist: 'Night Drive', cover: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=400&auto=format&fit=crop' },
]

// ─────────────────────────────────────────────
//  SECTION HEADER
// ─────────────────────────────────────────────
function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-16">
      <span className="inline-block px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold uppercase tracking-widest mb-4">{badge}</span>
      <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">{title}</h2>
      <p className="text-white/50 text-lg max-w-2xl mx-auto">{subtitle}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
//  MAIN LANDING PAGE
// ─────────────────────────────────────────────
export default function WelcomePage() {
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      {/* Custom styles */}
      <style jsx global>{`
        @keyframes eq-bar {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-in { animation: fadeSlideIn 0.5s ease-out forwards; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ════════ NAVBAR ════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navScrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-primary flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.3)]">
              <Music2 className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">Soundwave</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ai" className="hover:text-white transition-colors">AI Engine</a>
            <a href="#trending" className="hover:text-white transition-colors">Trending</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/discovery" className="hidden md:block text-sm text-white/60 hover:text-white transition-colors px-4 py-2">
              Log in
            </Link>
            <Link href="/discovery" className="px-5 py-2.5 bg-accent-primary text-black text-sm font-semibold rounded-full hover:bg-accent-primary-hover hover:scale-105 transition-all shadow-[0_0_20px_rgba(29,185,84,0.2)]">
              Start Listening
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════ HERO SECTION ════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <WaveformBackground />
        <GlowOrb className="w-[600px] h-[600px] bg-accent-primary/8 -top-40 -left-40" />
        <GlowOrb className="w-[400px] h-[400px] bg-purple-500/6 top-20 right-0" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center pt-20">
          {/* Left: Copy */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/60">
                <Zap className="w-3 h-3 text-accent-primary" />
                AI-Powered Music Discovery
              </span>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
                Feel the Music.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-emerald-400 to-accent-primary bg-[length:200%_auto] animate-[gradient-shift_4s_ease_infinite]">
                  Control the Vibe.
                </span>
              </h1>
              <p className="text-xl text-white/50 max-w-lg leading-relaxed">
                Stream, discover, and personalize your sound with AI-powered recommendations that understand your mood.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link href="/discovery" className="group px-8 py-4 bg-accent-primary text-black font-semibold rounded-full hover:bg-accent-primary-hover transition-all shadow-[0_0_40px_rgba(29,185,84,0.25)] hover:shadow-[0_0_60px_rgba(29,185,84,0.35)] hover:scale-105 flex items-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Start Listening
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#features" className="px-8 py-4 bg-white/[0.06] text-white font-semibold rounded-full border border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] transition-all hover:scale-105">
                Explore Features
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-10 pt-4">
              {[
                { value: 80, suffix: 'M+', label: 'Tracks' },
                { value: 4, suffix: 'M+', label: 'Artists' },
                { value: 500, suffix: 'K+', label: 'Daily Users' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mock Player */}
          <div className="hidden lg:block">
            <div style={{ animation: 'float 6s ease-in-out infinite' }}>
              <MockPlayer />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </section>

      {/* ════════ FEATURES SECTION ════════ */}
      <section id="features" className="relative py-32 px-6">
        <GlowOrb className="w-[500px] h-[500px] bg-accent-primary/5 top-0 right-0" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader 
            badge="Features" 
            title="Everything You Need" 
            subtitle="Powerful tools designed to make your music experience seamless and personal."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={Sparkles} title="AI Playlists" description="Our AI analyzes your listening patterns to create perfect playlists for every mood and moment." delay={0} />
            <FeatureCard icon={Search} title="Smart Search" description="Find any song, artist, or album instantly with intelligent auto-complete and typo correction." delay={100} />
            <FeatureCard icon={Brain} title="Mood Detection" description="Tell us how you feel — our engine maps your emotions to the perfect sonic landscape." delay={200} />
            <FeatureCard icon={Radio} title="Live Playback" description="Crystal-clear streaming with real-time audio visualization and lossless quality support." delay={300} />
            <FeatureCard icon={Headphones} title="Personalized" description="Every recommendation gets smarter the more you listen. Your taste, your algorithm." delay={400} />
            <FeatureCard icon={Heart} title="Social Sharing" description="Share playlists, discover what friends are playing, and collaborate on mixtapes." delay={500} />
            <FeatureCard icon={Mic} title="Voice Control" description="Just say what you want to hear. Our voice assistant understands natural commands." delay={600} />
            <FeatureCard icon={Zap} title="Instant Play" description="Zero-buffer playback with predictive preloading. Music starts before you tap play." delay={700} />
          </div>
        </div>
      </section>

      {/* ════════ AI DEMO SECTION ════════ */}
      <section id="ai" className="relative py-32 px-6">
        <GlowOrb className="w-[600px] h-[600px] bg-purple-500/5 -left-40 top-20" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader 
            badge="AI Engine" 
            title="Your Personal DJ" 
            subtitle="Tell Soundwave what you're in the mood for and watch the AI curate the perfect playlist in real-time."
          />
          <AiDemo />
        </div>
      </section>

      {/* ════════ TRENDING SECTION ════════ */}
      <section id="trending" className="relative py-32 px-6">
        <GlowOrb className="w-[400px] h-[400px] bg-accent-primary/5 right-0 bottom-0" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader 
            badge="Trending" 
            title="What's Hot Right Now" 
            subtitle="Discover the most-played tracks and albums across the globe."
          />

          <div className="flex gap-6 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory">
            {TRENDING_ALBUMS.map((album, i) => (
              <div 
                key={album.title}
                className="group flex-shrink-0 w-48 md:w-56 snap-start"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-xl bg-white/[0.03]">
                  <img 
                    src={album.cover} 
                    alt={album.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <button className="absolute bottom-3 right-3 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-[0_0_25px_rgba(29,185,84,0.4)] hover:scale-110">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>
                <h4 className="text-white font-semibold text-sm truncate">{album.title}</h4>
                <p className="text-white/40 text-xs truncate mt-0.5">{album.artist}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA SECTION ════════ */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 via-purple-500/5 to-accent-primary/10 rounded-3xl blur-3xl" />
          
          <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-12 md:p-20 text-center overflow-hidden">
            <GlowOrb className="w-[300px] h-[300px] bg-accent-primary/10 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Start Your Music{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-emerald-300">
                  Journey Today
                </span>
              </h2>
              <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
                Join millions of listeners who've already discovered a new way to experience music. Free forever.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/discovery" className="px-10 py-4 bg-accent-primary text-black font-bold rounded-full hover:bg-accent-primary-hover transition-all shadow-[0_0_40px_rgba(29,185,84,0.3)] hover:shadow-[0_0_60px_rgba(29,185,84,0.4)] hover:scale-105 text-lg">
                  Get Started Free
                </Link>
                <a href="#features" className="px-10 py-4 bg-white/[0.06] text-white font-semibold rounded-full border border-white/[0.1] hover:bg-white/[0.1] transition-all text-lg">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <Music2 className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold">Soundwave</span>
            <span className="text-white/30 text-sm">© 2026</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-white/40">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
              <Code2 className="w-4 h-4" /> GitHub
            </a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
              <Info className="w-4 h-4" /> About
            </a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
              <Mail className="w-4 h-4" /> Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
