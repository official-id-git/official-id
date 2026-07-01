'use client'

import { useEffect, useState } from 'react'
import { useCards } from '@/hooks/useCards'
import Badge3D from '@/components/badge/Badge3D'
import { Loader2 } from 'lucide-react'
import type { BusinessCard } from '@/types'
import Link from 'next/link'

export default function PublicBadgeClient({ cardId }: { cardId: string }) {
  const { fetchCard, loading } = useCards()
  const [card, setCard] = useState<BusinessCard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCard() {
      try {
        const fetchedCard = await fetchCard(cardId)
        if (fetchedCard) {
          setCard(fetchedCard)
        } else {
          setError('Badge tidak ditemukan')
        }
      } catch (err) {
        setError('Gagal memuat badge')
      }
    }
    loadCard()
  }, [cardId, fetchCard])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Badge Tidak Ditemukan</h1>
        <p className="text-gray-400 mb-8">Maaf, badge yang Anda cari tidak ada atau tidak aktif.</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-colors">
          Buat Kartu Sendiri
        </Link>
      </div>
    )
  }

  // @ts-ignore
  const badgeColor = card.badge_color || '#000000'
  // @ts-ignore
  const lanyardColor = card.lanyard_color || '#000000'

  return (
    <div className="w-full h-screen bg-gray-900 relative overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        <Badge3D 
          badgeColor={badgeColor} 
          lanyardColor={lanyardColor} 
          user={{ full_name: card.full_name, company: card.company || 'Official.id' }} 
        />
        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
          <span className="bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-md">
            Tarik badge menggunakan kursor/jari
          </span>
        </div>
      </div>
      
      {/* Footer Powered By */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center z-20 pointer-events-none bg-gradient-to-t from-gray-900/80 to-transparent">
        <a 
          href="https://official.id" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white transition-colors pointer-events-auto"
        >
          <span>Powered by</span>
          <span className="font-bold text-white tracking-wide">official.id</span>
        </a>
      </div>
    </div>
  )
}
