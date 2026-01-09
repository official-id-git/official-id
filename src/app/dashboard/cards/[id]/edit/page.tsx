'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import { CardForm } from '@/components/cards/CardForm'
import type { BusinessCard } from '@/types'

export default function EditCardPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { fetchCard, loading: cardLoading } = useCards()
  const [card, setCard] = useState<BusinessCard | null>(null)

  const cardId = params.id as string

  useEffect(() => {
    const loadCard = async () => {
      const data = await fetchCard(cardId)
      setCard(data)
    }
    if (user && cardId) {
      loadCard()
    }
  }, [user, cardId, fetchCard])

  if (authLoading || cardLoading || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/dashboard/cards/${card.id}`} className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Card Details
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit Business Card</h1>
          <p className="text-gray-500 mt-1">Update your business card information</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CardForm card={card} mode="edit" />
      </main>
    </div>
  )
}
