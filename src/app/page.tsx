'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SplashScreen() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Memuat aplikasi...')
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const stages = [
      { progress: 20, status: 'Menghubungkan ke server...' },
      { progress: 40, status: 'Memeriksa koneksi...' },
      { progress: 60, status: 'Memuat komponen...' },
      { progress: 80, status: 'Menyiapkan antarmuka...' },
      { progress: 100, status: 'Selesai!' },
    ]

    let currentStage = 0
    
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].progress)
        setStatus(stages[currentStage].status)
        currentStage++
      } else {
        clearInterval(interval)
        // Fade out then redirect
        setTimeout(() => {
          setFadeOut(true)
          setTimeout(() => {
            router.push('/login')
          }, 500)
        }, 300)
      }
    }, 400)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#2D7C88]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#E8BC66]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#7A9B6E]/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with animation */}
        <div className="relative mb-8">
          {/* Rotating ring */}
          <div className="absolute inset-0 w-40 h-40 -m-4">
            <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray="70 200"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2D7C88" />
                  <stop offset="50%" stopColor="#E8BC66" />
                  <stop offset="100%" stopColor="#7A9B6E" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          {/* Logo */}
          <div className="w-32 h-32 relative animate-bounce-slow">
            <Image
              src="/logo-splash.png"
              alt="Official ID"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Official<span className="text-[#E8BC66]">ID</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">Kartu Bisnis Digital</p>

        {/* Progress bar */}
        <div className="w-64 mb-4">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #2D7C88, #E8BC66, #7A9B6E)'
              }}
            />
          </div>
        </div>

        {/* Status text */}
        <p className="text-gray-400 text-sm animate-pulse">{status}</p>

        {/* Decorative dots */}
        <div className="flex gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#2D7C88] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-gray-500 text-xs">© 2025 Official ID</p>
        <p className="text-gray-600 text-xs mt-1">Powered by Data Official ID</p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
