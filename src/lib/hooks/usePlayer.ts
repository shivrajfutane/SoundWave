import { usePlayerStore, Song } from '@/lib/store/player'

export function usePlayer() {
  const store = usePlayerStore()

  // Additional helper logic could reside here if needed
  // For now, it predominantly wraps the zustand state to simplify component imports
  // Alternatively, just expose everything
  return store;
}
