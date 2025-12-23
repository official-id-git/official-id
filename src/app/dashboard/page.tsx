'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import { useOrganizations } from '@/hooks/useOrganizations'
import type { BusinessCard } from '@/types'
import BottomNavigation from '@/components/layout/BottomNavigation'
import FluidBackground from '@/components/ui/FluidBackground'

// Social Icons Helper
const getSocialIcon = (platform: string) => {
  const icons: Record<string, JSX.Element> = {
    linkedin: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    twitter: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    instagram: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    facebook: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    github: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    youtube: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    tiktok: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  }
  return icons[platform] || null
}

// Card Preview Component - Consistent with CardPreview.tsx
function CardPreview({ card }: { card: BusinessCard }) {
  const template = card.template || 'professional'
  const socialLinks = (card.social_links as Record<string, string>) || {}
  
  // Professional Template - White card with blue header + fluid animation
  if (template === 'professional') {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header with Fluid Animation */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-6 py-8 text-center overflow-hidden">
          {/* Animated Fluid Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/40 rounded-full filter blur-2xl animate-blob" />
            <div className="absolute top-10 -right-10 w-32 h-32 bg-cyan-400/30 rounded-full filter blur-2xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-10 left-1/4 w-36 h-36 bg-blue-300/30 rounded-full filter blur-2xl animate-blob animation-delay-4000" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {card.profile_photo_url ? (
              <div className="relative inline-block">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 rounded-full animate-spin-slow opacity-75 blur-sm" />
                <img
                  src={card.profile_photo_url}
                  alt={card.full_name}
                  className="relative w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg object-cover"
                />
              </div>
            ) : (
              <div className="relative inline-block">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 rounded-full animate-spin-slow opacity-75 blur-sm" />
                <div className="relative w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg bg-white flex items-center justify-center">
                  <span className="text-4xl font-bold text-blue-600">
                    {card.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <h3 className="text-2xl font-bold text-white mt-4">{card.full_name}</h3>
            {card.job_title && (
              <p className="text-blue-100 mt-1">{card.job_title}</p>
            )}
            {card.company && (
              <p className="text-blue-200 text-sm">{card.company}</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-5 space-y-3">
          {card.email && (
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm truncate">{card.email}</span>
            </div>
          )}

          {card.phone && (
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-sm">{card.phone}</span>
            </div>
          )}

          {card.website && (
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <span className="text-sm truncate">{card.website}</span>
            </div>
          )}

          {/* Social Icons */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex gap-2 pt-2 flex-wrap justify-center">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null
                return (
                  <div
                    key={platform}
                    className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"
                  >
                    {getSocialIcon(platform)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Modern Template - Dark theme
  if (template === 'modern') {
    return (
      <div className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden text-white">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            {card.profile_photo_url ? (
              <img 
                src={card.profile_photo_url} 
                alt={card.full_name}
                className="w-16 h-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{card.full_name.charAt(0)}</span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{card.full_name}</h3>
              <p className="text-purple-400">{card.job_title}</p>
              <p className="text-gray-500 text-sm">{card.company}</p>
            </div>
          </div>

          <div className="space-y-3 mt-5">
            {card.email && (
              <div className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm truncate">{card.email}</span>
              </div>
            )}
            {card.phone && (
              <div className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm">{card.phone}</span>
              </div>
            )}
            {card.website && (
              <div className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="text-sm truncate">{card.website}</span>
              </div>
            )}
          </div>

          {/* Social Icons */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null
                return (
                  <div
                    key={platform}
                    className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400"
                  >
                    {getSocialIcon(platform)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Minimal Template - Clean centered layout
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-8 text-center">
        {card.profile_photo_url ? (
          <img
            src={card.profile_photo_url}
            alt={card.full_name}
            className="w-20 h-20 rounded-full mx-auto object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
            <span className="text-3xl font-light text-gray-500">
              {card.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <h3 className="text-xl font-light text-gray-900 mt-4">{card.full_name}</h3>
        {card.job_title && (
          <p className="text-gray-500 text-sm">{card.job_title}</p>
        )}
        {card.company && (
          <p className="text-gray-400 text-sm">{card.company}</p>
        )}

        <div className="mt-6 space-y-2 text-sm">
          {card.email && (
            <p className="text-gray-600">{card.email}</p>
          )}
          {card.phone && (
            <p className="text-gray-600">{card.phone}</p>
          )}
          {card.website && (
            <p className="text-gray-600">{card.website}</p>
          )}
        </div>

        {/* Social Icons */}
        {Object.keys(socialLinks).length > 0 && (
          <div className="flex justify-center gap-4 mt-6">
            {Object.entries(socialLinks).map(([platform, url]) => {
              if (!url) return null
              return (
                <div
                  key={platform}
                  className="text-gray-400"
                >
                  {getSocialIcon(platform)}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

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
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const totalScans = cards.reduce((sum, card) => sum + (card.scan_count || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Animated Fluid Header */}
      <div className="relative overflow-hidden rounded-b-3xl">
        <FluidBackground className="z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-900/20 z-10" />
        <div className="absolute inset-0 z-10 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-20 px-4 pt-12 pb-6">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full animate-spin-slow opacity-75 blur-sm" />
                <div className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  <Image src="/logo.png" alt="Official ID" width={40} height={40} className="object-contain" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg">
                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                </div>
              </div>
              <button className="absolute right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 space-y-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 -mt-8 relative z-30">
          <div className="flex items-start gap-4">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <span className="text-blue-600 text-xl font-semibold">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Selamat Datang, {user.full_name.split(' ')[0]}!
              </h2>
              <p className="text-gray-500 text-sm mb-2">{user.email}</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'APP_ADMIN' ? 'bg-yellow-50 text-yellow-700' :
                user.role === 'PAID_USER' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {user.role === 'APP_ADMIN' && '👑 Admin'}
                {user.role === 'PAID_USER' && '⭐ Akun Berbayar'}
                {user.role === 'FREE_USER' && '📦 Akun Gratis'}
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
            <p className="text-gray-500 text-xs">Kartu Bisnis</p>
            <p className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : cards.length}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-gray-500 text-xs">Total Scan</p>
            <p className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : totalScans}</p>
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-xs">Organisasi</p>
            <p className="text-2xl font-semibold text-gray-900">{statsLoading ? '...' : orgsCount}</p>
          </div>
        </div>

        {/* Card Preview Section */}
        {!statsLoading && selectedCard ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Kartu Bisnis Anda</h3>
              <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
                {selectedCard.template || 'professional'}
              </span>
            </div>
            <Link href={`/dashboard/cards/${selectedCard.id}`}>
              <CardPreview card={selectedCard} />
            </Link>
            
            {cards.length > 1 && (
              <div className="flex gap-2 justify-center">
                {cards.slice(0, 3).map((card) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      selectedCard.id === card.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Kartu Bisnis</h3>
            <p className="text-gray-600 text-sm mb-4">Buat kartu bisnis digital pertama Anda!</p>
            <Link
              href="/dashboard/cards/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Kartu Sekarang
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

      <BottomNavigation variant="main" />
    </div>
  )
}
