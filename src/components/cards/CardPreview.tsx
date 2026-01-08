'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'
import type { BusinessCard } from '@/types'

import {
  ModernDarkCard,
  CreativeCard,
  MinimalWhiteCard,
  ElegantCard,
  CorporateCard,
  TechCard,
  ArtisticCard,
  LuxuryCard,
  VibrantCard
} from './templates/CardTemplates'

interface CardPreviewProps {
  card: BusinessCard
  template?: 'professional' | 'modern' | 'minimal' | 'modern_dark' | 'creative' | 'minimal_white' | 'elegant' | 'corporate' | 'tech' | 'artistic' | 'luxury' | 'vibrant'
  readonly?: boolean
}

export function CardPreview({ card, template = 'professional', readonly = false }: CardPreviewProps) {
  // --- LOGIKA SHARE LINKEDIN (BARU) ---
  const [isSharing, setIsSharing] = useState(false)
  const supabase = createClient()

  const handleLinkedInShare = async () => {
    setIsSharing(true)
    try {
      // 1. Ambil session browser untuk mendapatkan provider_token (LinkedIn Access Token)
      const { data: { session } } = await supabase.auth.getSession()

      // Cek apakah token LinkedIn tersedia
      if (!session?.provider_token) {
        toast.error('Token LinkedIn tidak ditemukan. Mohon Login ulang dengan LinkedIn.')
        setIsSharing(false)
        return
      }

      // 2. Panggil API Route Backend kita
      const response = await fetch('/api/linkedin/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: session.provider_token, // Token dikirim ke server
          cardUrl: `${window.location.origin}/c/${card.id}`,
          title: card.full_name,
          text: `Halo, ini kartu nama digital saya sebagai ${card.job_title} di ${card.company}. Mari terhubung!`
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal memposting ke LinkedIn')
      }

      toast.success('Berhasil dibagikan ke LinkedIn!')
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan saat membagikan.')
      console.error(error)
    } finally {
      setIsSharing(false)
    }
  }
  // --- AKHIR LOGIKA SHARE LINKEDIN ---

  // Use card's saved template if no template prop provided
  const activeTemplate = (card as any).template || template

  const visibleFields = (card.visible_fields as Record<string, boolean>) || {
    email: true,
    phone: true,
    website: true,
    social_links: true,
    address: true,
    city: true,
  }
  const socialLinks = (card.social_links as Record<string, string>) || {}

  // Generate vCard data
  const generateVCard = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.full_name}`,
      card.job_title ? `TITLE:${card.job_title}` : '',
      card.company ? `ORG:${card.company}` : '',
      visibleFields.email ? `EMAIL:${card.email}` : '',
      visibleFields.phone ? `TEL:${card.phone}` : '',
      visibleFields.website && card.website ? `URL:${card.website}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\n')

    const blob = new Blob([vcard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${card.full_name.replace(/\s+/g, '_')}.vcf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getSocialIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      instagram: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      facebook: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
      youtube: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      tiktok: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    }
    return icons[platform] || null
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Professional Template with Fluid Animation */}
      {activeTemplate === 'professional' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with Fluid Animation */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-6 py-8 text-center overflow-hidden">
            {/* Animated Fluid Background */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Blob 1 */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/40 rounded-full filter blur-2xl animate-blob" />
              {/* Blob 2 */}
              <div className="absolute top-10 -right-10 w-32 h-32 bg-cyan-400/30 rounded-full filter blur-2xl animate-blob animation-delay-2000" />
              {/* Blob 3 */}
              <div className="absolute -bottom-10 left-1/4 w-36 h-36 bg-blue-300/30 rounded-full filter blur-2xl animate-blob animation-delay-4000" />
              {/* Blob 4 */}
              <div className="absolute bottom-0 right-0 w-28 h-28 bg-purple-400/20 rounded-full filter blur-2xl animate-blob animation-delay-6000" />
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              {/* Wave overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-blue-900/30 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {card.profile_photo_url ? (
                <div className="relative inline-block">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 rounded-full animate-spin-slow opacity-75 blur-sm" />
                  <Image
                    src={card.profile_photo_url}
                    alt={card.full_name}
                    width={96}
                    height={96}
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
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-4 break-words">{card.full_name}</h1>
              {card.job_title && (
                <p className="text-blue-100 mt-1">{card.job_title}</p>
              )}
              {card.company && (
                <p className="text-blue-200 text-sm">{card.company}</p>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-6 py-6 space-y-4">
            {visibleFields.email && (
              <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="break-all">{card.email}</span>
              </a>
            )}

            {visibleFields.phone && (
              <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span>{card.phone}</span>
              </a>
            )}

            {visibleFields.website && card.website && (
              <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span className="break-all">{card.website}</span>
              </a>
            )}

            {/* Address and City Display */}
            {(visibleFields.address || visibleFields.city) && (
              ((card as any).address && (card as any).address !== 'belum diisi') ||
              ((card as any).city && (card as any).city !== 'belum diisi')
            ) && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    {visibleFields.address && (card as any).address && (card as any).address !== 'belum diisi' && (
                      <span className="break-words">{(card as any).address}</span>
                    )}
                    {visibleFields.city && (card as any).city && (card as any).city !== 'belum diisi' && (
                      <span className="text-gray-500 text-sm">{(card as any).city}</span>
                    )}
                  </div>
                </div>
              )}

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-3 pt-2 flex-wrap justify-center">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url) return null
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {getSocialIcon(platform)}
                    </a>
                  )
                })}
              </div>
            )}

            {!readonly && (
              <button
                onClick={generateVCard}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Simpan Kontak
              </button>
            )}
          </div>
        </div>
      )}


      {/* Modern Template */}
      {activeTemplate === 'modern' && (
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden text-white">
          <div className="px-6 py-8">
            <div className="flex items-center gap-4">
              {card.profile_photo_url ? (
                <Image
                  src={card.profile_photo_url}
                  alt={card.full_name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {card.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold break-words">{card.full_name}</h1>
                {card.job_title && (
                  <p className="text-purple-400">{card.job_title}</p>
                )}
                {card.company && (
                  <p className="text-gray-500 text-sm">{card.company}</p>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {visibleFields.email && (
                <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="break-all">{card.email}</span>
                </a>
              )}
              {visibleFields.phone && (
                <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{card.phone}</span>
                </a>
              )}
              {visibleFields.website && card.website && (
                <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="break-all">{card.website}</span>
                </a>
              )}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-3 mt-6 flex-wrap">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url) return null
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
                    >
                      {getSocialIcon(platform)}
                    </a>
                  )
                })}
              </div>
            )}

            <button
              onClick={generateVCard}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Simpan Kontak
            </button>
          </div>
        </div>
      )}

      {/* Minimal Template */}
      {activeTemplate === 'minimal' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            {card.profile_photo_url ? (
              <Image
                src={card.profile_photo_url}
                alt={card.full_name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                <span className="text-3xl font-light text-gray-500">
                  {card.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-light text-gray-900 mt-4 break-words">{card.full_name}</h1>
            {card.job_title && (
              <p className="text-gray-500 text-sm">{card.job_title}</p>
            )}
            {card.company && (
              <p className="text-gray-400 text-sm">{card.company}</p>
            )}

            <div className="mt-6 space-y-2 text-sm">
              {visibleFields.email && (
                <a href={`mailto:${card.email}`} className="block text-gray-600 hover:text-gray-900 transition-colors">
                  {card.email}
                </a>
              )}
              {visibleFields.phone && (
                <a href={`tel:${card.phone}`} className="block text-gray-600 hover:text-gray-900 transition-colors">
                  {card.phone}
                </a>
              )}
              {visibleFields.website && card.website && (
                <a href={card.website} target="_blank" rel="noopener noreferrer" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  {card.website}
                </a>
              )}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
              <div className="flex justify-center gap-4 mt-6">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  if (!url) return null
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {getSocialIcon(platform)}
                    </a>
                  )
                })}
              </div>
            )}

            <button
              onClick={generateVCard}
              className="mt-6 px-6 py-2 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50 transition-colors"
            >
              Simpan Kontak
            </button>
          </div>
        </div>
      )}

      {/* New Templates */}
      {activeTemplate === 'modern_dark' && (
        <ModernDarkCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'creative' && (
        <CreativeCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'minimal_white' && (
        <MinimalWhiteCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'elegant' && (
        <ElegantCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'corporate' && (
        <CorporateCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'tech' && (
        <TechCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'artistic' && (
        <ArtisticCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'luxury' && (
        <LuxuryCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}
      {activeTemplate === 'vibrant' && (
        <VibrantCard
          card={card}
          visibleFields={visibleFields}
          socialLinks={socialLinks}
          onGenerateVCard={generateVCard}
          readonly={readonly}
        />
      )}

      {/* --- TOMBOL SHARE LINKEDIN BARU --- */}
      {!readonly && (
        <div className="mt-6 px-4 pb-4">
          <button
            onClick={handleLinkedInShare}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 bg-[#0077b5] text-white py-3 rounded-xl font-medium hover:bg-[#006396] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSharing ? (
              <span>Memposting...</span>
            ) : (
              <>
                {/* Icon LinkedIn Simple */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Bagikan ke LinkedIn
              </>
            )}
          </button>
        </div>
      )}

    </div>
  )
}