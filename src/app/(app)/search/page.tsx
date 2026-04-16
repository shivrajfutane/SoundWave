'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { SongCard } from '@/components/ui/SongCard'
import StaggerList from '@/components/animations/StaggerList'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { searchSongs, SearchResult } from '@/lib/search'
import { usePlayerStore } from '@/lib/store/player'

const GENRES = [
  { name: 'Pop', color: 'bg-pink-600', img: 'https://images.unsplash.com/photo-1514525253361-bee8a487409e?q=80&w=400&auto=format&fit=crop' },
  { name: 'Hip Hop', color: 'bg-orange-600', img: 'https://images.unsplash.com/photo-1546529304-7407a3939bc6?q=80&w=400&auto=format&fit=crop' },
  { name: 'Rock', color: 'bg-red-700', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400&auto=format&fit=crop' },
  { name: 'Electronic', color: 'bg-blue-600', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop' },
  { name: 'Jazz', color: 'bg-yellow-700', img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=400&auto=format&fit=crop' },
  { name: 'Classical', color: 'bg-amber-800', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400&auto=format&fit=crop' },
  { name: 'Indie', color: 'bg-emerald-600', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=400&auto=format&fit=crop' },
  { name: 'R&B', color: 'bg-purple-700', img: 'https://images.unsplash.com/photo-1504173010664-32509aaeba92?q=80&w=400&auto=format&fit=crop' },
  { name: 'Acoustic', color: 'bg-teal-600', img: 'https://images.unsplash.com/photo-1453738773917-9c3eff1db985?q=80&w=400&auto=format&fit=crop' },
  { name: 'Ambient', color: 'bg-indigo-700', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&auto=format&fit=crop' },
]

export default function SearchPage() {
  const { play } = usePlayerStore()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchMeta, setSearchMeta] = useState<{ strategy: string; took_ms: number; cached: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      setSearchMeta(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    searchSongs(debouncedQuery, 24)
      .then(response => {
        if (cancelled) return
        setResults(response.hits)
        setSearchMeta({ strategy: response.strategy, took_ms: response.took_ms, cached: response.cached })
        setIsLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        console.error('[SearchPage]', err)
        setError(err.message || 'Search failed. Please try again.')
        setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery])

  return (
    <div className="flex flex-col gap-8 pb-10 min-h-full">
      <section className="pt-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8 text-text-primary">
          Search
        </h1>
        
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted" />
          <Input 
            type="text"
            placeholder="Artists, songs, or podcasts"
            className="w-full h-14 pl-14 pr-4 rounded-full bg-glass-bg border-glass-border focus-visible:ring-accent-primary text-lg transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-primary animate-spin" />
          )}
        </div>

        {/* Search meta — shows strategy & timing in dev */}
        {searchMeta && results.length > 0 && (
          <p className="text-xs text-text-muted mt-3 font-mono">
            {results.length} results · {searchMeta.took_ms}ms · {searchMeta.cached ? '⚡ cached' : searchMeta.strategy}
          </p>
        )}
      </section>

      <section className="flex-1 w-full overflow-hidden">
        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-red-400">
            <p className="text-lg font-semibold">Something went wrong</p>
            <p className="text-sm mt-1 text-text-muted">{error}</p>
            <button 
              onClick={() => setQuery(q => q + ' ')} // re-trigger
              className="mt-4 px-4 py-2 rounded-full bg-glass-bg border border-glass-border text-text-primary hover:bg-glass-bg-hover transition-all text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results layout */}
        {!isLoading && !error && results.length > 0 && (
          <div className="flex flex-col gap-10 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Split layout for Top Result and Songs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Top Result */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight text-sm text-text-muted">Top result</h2>
                <div 
                  onClick={() => play(results[0], results)}
                  className="group relative p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl h-full flex flex-col justify-end min-h-[240px]"
                >
                  <div className="absolute top-6 left-6 w-24 h-24 rounded-lg overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <img 
                      src={results[0].cover_url || '/placeholder-cover.png'} 
                      alt={results[0].title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-bold text-text-primary truncate mb-1">
                      {results[0].title}
                    </h3>
                    <div className="flex items-center gap-2 mb-6 text-lg">
                      <span className="text-text-secondary">
                        {results[0].artist}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold tracking-widest text-text-muted border border-white/5">
                        {results[0].source === 'youtube' ? 'Official Audio' : 'Free Track'}
                      </span>
                    </div>
                  </div>

                  {/* Large play button */}
                  <div className="absolute bottom-6 right-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-14 h-14 bg-accent-primary rounded-full flex items-center justify-center text-black shadow-2xl shadow-accent-primary/20 hover:scale-110 active:scale-95 transition-all">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 6v12l10-6z" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Right Column: Songs (List) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight text-sm text-text-muted">Songs</h2>
                </div>
                <div className="flex flex-col">
                  {results.slice(1, 6).map((song, i) => (
                    <SongCard 
                      key={song.id} 
                      song={song as any} 
                      variant="row" 
                      index={i + 1} 
                      queue={results}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Results Grid */}
            {results.length > 6 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight text-sm text-text-muted">Browse more</h2>
                <StaggerList className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {results.slice(6).map((song, i) => (
                    <div key={song.id} className="min-w-0">
                      <SongCard song={song as any} index={i} queue={results} />
                    </div>
                  ))}
                </StaggerList>
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {!isLoading && !error && debouncedQuery && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted animate-in fade-in duration-500">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg">No results found for &quot;{debouncedQuery}&quot;</p>
            <p className="text-sm mt-1">Make sure your words are spelled correctly, or try different keywords.</p>
          </div>
        )}

        {/* Browse genres (empty state) */}
        {!isLoading && !error && !debouncedQuery && (
          <div className="mt-4">
             <h2 className="text-xl font-bold text-text-primary mb-6">Browse all</h2>
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
               {GENRES.map(genre => (
                 <div 
                   key={genre.name} 
                   onClick={() => setQuery(genre.name)}
                   className={`aspect-square md:aspect-[4/3] rounded-2xl ${genre.color} p-5 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden relative group shadow-lg`}
                 >
                   <h3 className="font-display font-bold text-2xl md:text-3xl text-white relative z-10">{genre.name}</h3>
                   <img 
                      src={genre.img} 
                      alt="" 
                      className="absolute bottom-0 right-0 w-24 h-24 md:w-32 md:h-32 object-cover rounded-tl-lg shadow-2xl translate-x-4 translate-y-4 rotate-[25deg] group-hover:rotate-[15deg] group-hover:scale-110 transition-transform duration-500 opacity-80"
                   />
                   <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                 </div>
               ))}
             </div>
          </div>
        )}
      </section>
    </div>
  )
}
