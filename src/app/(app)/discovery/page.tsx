import { Sparkles } from 'lucide-react'
import { fetchTrending, fetchNewReleases, mapToSong } from '@/lib/jamendo'
import DiscoveryClient from './DiscoveryClient'

export const revalidate = 3600

export default async function DiscoveryPage() {
  const [trending, newReleases] = await Promise.all([
    fetchTrending(18),
    fetchNewReleases(18),
  ])

  const mapJamendoToSong = (t: any) => {
    const mapped = mapToSong(t)
    return { ...mapped, id: mapped.jamendo_id }
  }

  const trendingSongs = trending.map(mapJamendoToSong)
  const newReleaseSongs = newReleases.map(mapJamendoToSong)

  return <DiscoveryClient trendingSongs={trendingSongs} newReleaseSongs={newReleaseSongs} />
}
