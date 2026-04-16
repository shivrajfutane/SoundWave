// Compatibility shim — routes to the new unified library store
export { useLibraryStore as default } from '../store/library'

import { useLibraryStore } from '../store/library'

/** @deprecated Use useLibraryStore from '@/lib/store/library' directly */
export function useLikedSongs() {
  const { likedSongs, toggleLike, isLiked } = useLibraryStore()
  return {
    likedSongs,
    loading: false,
    toggleLike,
    isLiked,
  }
}
