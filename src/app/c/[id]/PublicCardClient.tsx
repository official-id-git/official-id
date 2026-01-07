'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CardPreview } from '@/components/cards/CardPreview'
import type { BusinessCard } from '@/types'

interface Props {
  cardId: string
}

export default function PublicCardClient({ cardId }: Props) {
  const [card, setCard] = useState<BusinessCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCard = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // Fetch public card
        // Check if cardId is UUID or Username
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardId)

        // Initialize query builder function for cleaner logic
        const fetchCard = async () => {
          const selectFields = 'id, user_id, full_name, job_title, company, email, phone, website, profile_photo_url, social_links, is_public, visible_fields, scan_count, created_at, updated_at, template, address, color_theme, username'

          // 1. Try fetching by ID or Username as usual
          // Use limit(1) instead of single()/maybeSingle() to strictly avoid 406 errors on 0 rows
          let query = supabase
            .from('business_cards')
            .select(selectFields)
            .eq('is_public', true)
            .limit(1)

          if (isUuid) {
            query = query.eq('id', cardId)
          } else {
            query = query.eq('username', cardId)
          }

          const { data: idData, error: idError } = await query

          if (idData && idData.length > 0) {
            return { data: idData[0], error: null }
          }

          // Log error but continue to fallback
          if (idError) {
            console.error('Error fetching by ID:', idError)
          }

          // 2. If no data found AND input is UUID, try fetching by user_id
          // This supports the circle link format: /c/[userId]
          if (isUuid) {
            const { data: userData, error: userError } = await supabase
              .from('business_cards')
              .select(selectFields)
              .eq('is_public', true)
              .eq('user_id', cardId)
              .limit(1)

            if (userData && userData.length > 0) {
              return { data: userData[0], error: null }
            }

            if (userError) return { data: null, error: userError }
          }

          return { data: null, error: null }
        }

        const { data, error: fetchError } = await fetchCard()

        if (fetchError) {
          setError('Gagal memuat kartu')
          return
        }

        if (!data) {
          setError('Kartu tidak ditemukan atau tidak tersedia untuk publik')
          return
        }

        setCard(data)

        // Increment scan count (fire and forget)
        supabase
          .from('business_cards')
          .update({ scan_count: (data.scan_count || 0) + 1 })
          .eq('id', cardId)
          .then(() => { })
          .catch(() => { })

      } catch (err) {
        setError('Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    }

    if (cardId) {
      loadCard()
    }
  }, [cardId])

  const handleBack = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat kartu...</p>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Kartu Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">{error || 'Kartu yang Anda cari tidak tersedia atau sudah dihapus.'}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </div>
      </div>
    )
  }

  const template = card.template || 'professional'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4">
      {/* Back Button */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
      </div>

      {/* Card Preview */}
      <CardPreview card={card} template={template as 'professional' | 'modern' | 'minimal'} />

      {/* QR Code */}
      {/* Exclude QR code initially due to 406 error with large base64 */}
      {/* 
      {card.qr_code_url && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Scan QR code untuk menyimpan kontak</p>
          <Image
            src={card.qr_code_url}
            alt="QR Code"
            width={120}
            height={120}
            className="mx-auto bg-white p-2 rounded-lg shadow"
          />
        </div>
      )}
      */}

      {/* Powered By */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          Powered by{' '}
          <a href="https://official.id" className="text-blue-600 hover:text-blue-700">
            Official ID
          </a>
        </p>
      </div>
    </div>
  )
}
