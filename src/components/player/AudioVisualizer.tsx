'use client'
import { useEffect, useRef } from 'react'
import { Howler } from 'howler'

export default function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | undefined>(undefined)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    const ctx = Howler.ctx
    if (!ctx) return

    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    analyserRef.current = analyser

    // Connect Howler master gain → analyser → destination
    try {
        Howler.masterGain.connect(analyser)
        analyser.connect(ctx.destination)
    } catch (e) {
        console.warn("Could not connect audio analyser", e)
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const canvas = canvasRef.current!
    const c = canvas.getContext('2d')!

    const draw = () => {
      animRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      c.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 1.8
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9

        // Gradient: green → purple
        const gradient = c.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
        gradient.addColorStop(0, '#1DB954')
        gradient.addColorStop(1, '#8B5CF6')

        c.fillStyle = gradient
        c.beginPath()
        c.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 3)
        c.fill()

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      try { 
        if (analyserRef.current) {
          Howler.masterGain.disconnect(analyserRef.current) 
          analyserRef.current.disconnect()
        }
      } catch {}
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={48}
      className="w-full h-12 opacity-70"
    />
  )
}
