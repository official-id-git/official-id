'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import type { BusinessCard } from '@/types'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function CardsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { fetchCards, deleteCard } = useCards()
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [cardsLoading, setCardsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadCards = async () => {
      if (user) {
        setCardsLoading(true)
        try {
          const data = await fetchCards()
          setCards(data)
        } catch (error) {
          console.error('Error loading cards:', error)
        } finally {
          setCardsLoading(false)
        }
      }
    }
    loadCards()
  }, [user])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalScans = cards.reduce((sum, card) => sum + (card.scan_count || 0), 0)
  const publicCards = cards.filter(c => c.is_public).length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kartu Bisnis Saya</h1>
            </div>
            <Link
              href="/dashboard/cards/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Buat Kartu Baru</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Total Kartu</p>
              <p className="text-3xl font-bold text-gray-900">{cardsLoading ? '...' : cards.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Scan</p>
              <p className="text-3xl font-bold text-gray-900">{cardsLoading ? '...' : totalScans}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Kartu Publik</p>
              <p className="text-3xl font-bold text-gray-900">{cardsLoading ? '...' : publicCards}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="max-w-4xl mx-auto px-4">
        {cardsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada kartu bisnis</h3>
            <p className="text-gray-500 mb-6">Buat kartu bisnis digital pertama Anda</p>
            <Link
              href="/dashboard/cards/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Kartu
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {cards.map((card) => (
              <Link
                key={card.id}
                href={`/dashboard/cards/${card.id}`}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {card.profile_photo_url ? (
                    <img 
                      src={card.profile_photo_url} 
                      alt={card.full_name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 text-xl font-semibold">{card.full_name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{card.full_name}</h3>
                    <p className="text-gray-500 text-sm truncate">{card.job_title}</p>
                    <p className="text-gray-400 text-xs truncate">{card.company}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                      card.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {card.is_public ? 'Publik' : 'Privat'}
                    </span>
                    <p className="text-gray-400 text-xs mt-1">{card.scan_count} scan</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation variant="cards" />
    </div>
  )
}
