'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import { useOrganizations } from '@/hooks/useOrganizations'
import type { BusinessCard } from '@/types'
import FluidBackground from '@/components/ui/FluidBackground'
import { CardPreview } from '@/components/cards/CardPreview'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { fetchCards } = useCards()
  const { fetchMyOrganizations, fetchJoinedOrganizations } = useOrganizations()
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)
  const [orgsCount, setOrgsCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        setStatsLoading(true)
        try {
          const [cardsData, myOrgs, joinedOrgs] = await Promise.all([
            fetchCards(),
            fetchMyOrganizations(),
            fetchJoinedOrganizations(),
          ])
          setCards(cardsData)
          if (cardsData.length > 0) {
            setSelectedCard(cardsData[0])
          }
          const joinedIds = joinedOrgs.filter(j => !myOrgs.find(o => o.id === j.id))
          setOrgsCount(myOrgs.length + joinedIds.length)
        } catch (error) {
          console.error('Error loading stats:', error)
        } finally {
          setStatsLoading(false)
        }
      }
    }
    loadStats()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const totalScans = cards.reduce((sum, card) => sum + (card.scan_count || 0), 0)

  return (
    <div className="px-4 space-y-6 -mt-4">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg text-white mb-6">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex items-center gap-4">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
          ) : (
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/20">
              <span className="text-white text-2xl font-bold">
                {user.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold mb-1">
              Hello, {user.full_name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-blue-100 text-sm mb-2">{user.email}</p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-md`}>
              {user.role === 'APP_ADMIN' && '👑 Administrator'}
              {user.role === 'PAID_USER' && '⭐ Member Pro'}
              {user.role === 'FREE_USER' && '📦 Free Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-gray-500 text-xs">Business Cards</p>
          <p className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : cards.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-gray-500 text-xs">Total Scans</p>
          <p className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : totalScans}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-xs">Organizations</p>
          <p className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : orgsCount}</p>
        </div>
      </div>

      {/* Card Preview Section */}
      {!statsLoading && selectedCard ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Your Business Card</h3>
            <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
              {selectedCard.template || 'professional'}
            </span>
          </div>

          {/* Swipeable Card Container */}
          <div
            className="touch-pan-y select-none cursor-grab active:cursor-grabbing"
            onTouchStart={(e) => {
              const touch = e.touches[0]
                ; (e.currentTarget as any).touchStartX = touch.clientX
                ; (e.currentTarget as any).touchStartY = touch.clientY
            }}
            onTouchEnd={(e) => {
              const startX = (e.currentTarget as any).touchStartX
              const startY = (e.currentTarget as any).touchStartY
              const touch = e.changedTouches[0]
              const diffX = touch.clientX - startX
              const diffY = touch.clientY - startY

              // Only swipe if horizontal movement is greater than vertical
              if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                const currentIndex = cards.findIndex(c => c.id === selectedCard.id)
                if (diffX < 0 && currentIndex < cards.length - 1) {
                  // Swipe left - next card
                  setSelectedCard(cards[currentIndex + 1])
                } else if (diffX > 0 && currentIndex > 0) {
                  // Swipe right - previous card
                  setSelectedCard(cards[currentIndex - 1])
                }
              }
            }}
            onMouseDown={(e) => {
              ; (e.currentTarget as any).mouseStartX = e.clientX
                ; (e.currentTarget as any).isDragging = true
            }}
            onMouseUp={(e) => {
              if (!(e.currentTarget as any).isDragging) return
                ; (e.currentTarget as any).isDragging = false
              const startX = (e.currentTarget as any).mouseStartX
              const diffX = e.clientX - startX

              if (Math.abs(diffX) > 50) {
                const currentIndex = cards.findIndex(c => c.id === selectedCard.id)
                if (diffX < 0 && currentIndex < cards.length - 1) {
                  setSelectedCard(cards[currentIndex + 1])
                } else if (diffX > 0 && currentIndex > 0) {
                  setSelectedCard(cards[currentIndex - 1])
                }
              }
            }}
            onMouseLeave={(e) => {
              ; (e.currentTarget as any).isDragging = false
            }}
          >
            <Link href={`/dashboard/cards/${selectedCard.id}`} draggable={false}>
              <CardPreview card={selectedCard} readonly={true} />
            </Link>
          </div>

          {cards.length > 1 && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2 justify-center">
                {cards.slice(0, 5).map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`w-3 h-3 rounded-full transition-all ${selectedCard.id === card.id ? 'bg-blue-600 w-5' : 'bg-gray-300'
                      }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">Swipe to change card</p>
            </div>
          )}
        </div>
      ) : !statsLoading && cards.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 text-center border border-blue-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Cards Yet</h3>
          <p className="text-gray-600 text-sm mb-4">Create your first digital business card!</p>
          <Link
            href="/dashboard/cards/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Card Now
          </Link>
        </div>
      ) : null}

      {/* Admin Panel Button */}
      {user.role === 'APP_ADMIN' && (
        <Link
          href="/dashboard/admin"
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all w-full shadow-lg shadow-red-500/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Admin Panel</span>
        </Link>
      )}

      {/* Upgrade Pro Button */}
      {user.role === 'FREE_USER' && (
        <Link
          href="/dashboard/upgrade"
          className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 transition-all w-full shadow-lg shadow-yellow-500/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <span>Upgrade to Pro</span>
        </Link>
      )}

      {/* Brand Footer */}
      <div className="pt-4 pb-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#7D9B76]"></div>
          <div className="w-6 h-6 rounded-full bg-[#2C7A7B]"></div>
          <div className="w-6 h-6 rounded-full bg-[#D9B86A]"></div>
          <div className="w-6 h-6 rounded-full bg-[#D67272]"></div>
          <div className="w-6 h-6 rounded-full bg-[#2563EB]"></div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Official ID v1.0.0</p>
      </div>
    </div>
  )
}
