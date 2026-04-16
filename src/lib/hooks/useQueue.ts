import { usePlayerStore, Song } from '@/lib/store/player'

export function useQueue() {
  const queue = usePlayerStore(state => state.queue)
  const addToQueue = usePlayerStore(state => state.addToQueue)
  const removeFromQueue = usePlayerStore(state => state.removeFromQueue)

  return { queue, addToQueue, removeFromQueue }
}
