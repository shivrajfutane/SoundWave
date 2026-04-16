import { useEffect, useRef, useState } from 'react'
import { Howler } from 'howler'

export function useAudioAnalyser(fftSize: number = 128) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null)
  const animRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    // Only works if window and Howler Ctx exists
    const ctx = Howler.ctx
    if (!ctx) return

    // If an analyser doesn't exist, create it
    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser()
      analyser.fftSize = fftSize
      analyserRef.current = analyser

      // Try connecting Howler.masterGain -> analyser -> destination
      try {
        Howler.masterGain.connect(analyser)
        analyser.connect(ctx.destination)
      } catch (e) {
        console.warn("Could not connect audio analyser", e)
      }
    }

    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const array = new Uint8Array(bufferLength)
    setDataArray(array)

    // Optional loop logic for those who want just the hook
    // Real implementation goes inside the canvas drawing component
    return () => {
      try {
        if (analyserRef.current) {
          Howler.masterGain.disconnect(analyserRef.current)
          analyserRef.current.disconnect()
        }
      } catch {}
    }
  }, [fftSize])

  return { analyser: analyserRef.current, dataArray }
}
