'use client'

import { useEffect, useRef } from 'react'

interface FluidBackgroundProps {
  className?: string
}

export default function FluidBackground({ className = '' }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Fluid simulation parameters
    const blobs = [
      { x: 0.3, y: 0.4, radius: 0.4, speedX: 0.0003, speedY: 0.0004, color: 'rgba(59, 130, 246, 0.6)' },
      { x: 0.7, y: 0.3, radius: 0.35, speedX: -0.0004, speedY: 0.0003, color: 'rgba(37, 99, 235, 0.5)' },
      { x: 0.5, y: 0.7, radius: 0.3, speedX: 0.0002, speedY: -0.0003, color: 'rgba(96, 165, 250, 0.4)' },
      { x: 0.2, y: 0.6, radius: 0.25, speedX: 0.0005, speedY: 0.0002, color: 'rgba(147, 197, 253, 0.3)' },
      { x: 0.8, y: 0.5, radius: 0.28, speedX: -0.0003, speedY: -0.0004, color: 'rgba(29, 78, 216, 0.5)' },
    ]

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Skip if dimensions are invalid
      if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#2563eb')
      gradient.addColorStop(0.5, '#1d4ed8')
      gradient.addColorStop(1, '#1e40af')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Update and draw blobs
      time += 1

      blobs.forEach((blob, index) => {
        // Organic movement using sine waves
        const offsetX = Math.sin(time * blob.speedX * 10 + index) * 0.1
        const offsetY = Math.cos(time * blob.speedY * 10 + index * 0.5) * 0.1
        
        const x = (blob.x + offsetX) * width
        const y = (blob.y + offsetY) * height
        const radius = blob.radius * Math.min(width, height)

        // Skip invalid values
        if (!isFinite(x) || !isFinite(y) || !isFinite(radius) || radius <= 0) return

        // Create radial gradient for each blob
        const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        blobGradient.addColorStop(0, blob.color)
        blobGradient.addColorStop(0.5, blob.color.replace(/[\d.]+\)$/, '0.3)'))
        blobGradient.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = blobGradient
        ctx.fill()
      })

      // Add floating particles
      for (let i = 0; i < 20; i++) {
        const particleX = (Math.sin(time * 0.001 + i * 0.5) * 0.4 + 0.5) * width
        const particleY = (Math.cos(time * 0.0015 + i * 0.3) * 0.3 + 0.5) * height
        const particleRadius = 2 + Math.sin(time * 0.005 + i) * 1

        if (!isFinite(particleX) || !isFinite(particleY) || particleRadius <= 0) continue

        ctx.beginPath()
        ctx.arc(particleX, particleY, particleRadius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time * 0.003 + i) * 0.05})`
        ctx.fill()
      }

      // Add wave effect at bottom
      ctx.beginPath()
      ctx.moveTo(0, height)
      
      for (let x = 0; x <= width; x += 5) {
        const waveY = height - 20 + Math.sin(x * 0.02 + time * 0.002) * 10 + Math.sin(x * 0.01 + time * 0.003) * 5
        if (isFinite(waveY)) {
          ctx.lineTo(x, waveY)
        }
      }
      
      ctx.lineTo(width, height)
      ctx.closePath()
      
      const waveGradient = ctx.createLinearGradient(0, height - 30, 0, height)
      waveGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      waveGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)')
      ctx.fillStyle = waveGradient
      ctx.fill()

      // Add shimmer effect
      const shimmerX = (time * 0.5) % (width * 2) - width * 0.5
      if (isFinite(shimmerX)) {
        const shimmerGradient = ctx.createLinearGradient(shimmerX, 0, shimmerX + 100, 0)
        shimmerGradient.addColorStop(0, 'transparent')
        shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
        shimmerGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = shimmerGradient
        ctx.fillRect(0, 0, width, height)
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ filter: 'blur(40px)' }}
    />
  )
}
