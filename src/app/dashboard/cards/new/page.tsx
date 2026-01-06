'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import BottomNavigation from '@/components/layout/BottomNavigation'
import { CardForm } from '@/components/cards/CardForm'

export default function NewCardPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchCards } = useCards()

  const [existingCardsCount, setExistingCardsCount] = useState<number>(0)
  const [checkingCards, setCheckingCards] = useState(true)

  // Check existing cards count for FREE_USER
  useEffect(() => {
    const checkCards = async () => {
      if (user) {
        setCheckingCards(true)
        try {
          const cards = await fetchCards()
          setExistingCardsCount(cards.length)
        } catch (err) {
          console.error('Error checking cards:', err)
        } finally {
          setCheckingCards(false)
        }
      }
    }
    checkCards()
  }, [user, fetchCards])

  // Check if FREE_USER already has a card
  const isFreeUserWithCard = user?.role === 'FREE_USER' && existingCardsCount >= 1

  // Loading state
  if (authLoading || checkingCards) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show upgrade message if FREE_USER already has a card
  if (isFreeUserWithCard) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Buat Kartu Bisnis Baru</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 text-center border border-yellow-200">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Batas Kartu Tercapai</h2>
            <p className="text-gray-600 mb-6">
              Akun gratis hanya dapat membuat 1 kartu bisnis. Upgrade ke Pro untuk membuat kartu tanpa batas!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard/upgrade"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl font-medium hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Upgrade ke Pro
              </Link>
              <Link
                href="/dashboard/cards"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Lihat Kartu Saya
              </Link>
            </div>
          </div>
        </div>

        <BottomNavigation variant="cards" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Buat Kartu Bisnis Baru</h1>
          <p className="text-gray-500 text-sm mt-1">Isi informasi untuk kartu bisnis digital Anda</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <CardForm mode="create" />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation variant="cards" />
    </div>
  )
}
