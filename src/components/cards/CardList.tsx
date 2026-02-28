'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCards } from '@/hooks/useCards'

import { getPublicCardUrl } from '@/lib/qrcode'
import type { BusinessCard } from '@/types'

interface CardListProps {
  cards: BusinessCard[]
  onDelete?: (id: string) => void
}

export function CardList({ cards, onDelete }: CardListProps) {
  const { deleteCard } = useCards()
  const [deletingId, setDeletingId] = useState<string | null>(null)


  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kartu "${name}"?`)) return

    setDeletingId(id)
    const success = await deleteCard(id)
    if (success && onDelete) {
      onDelete(id)
    }
    setDeletingId(null)
  }



  const copyLink = async (cardId: string, username?: string) => {
    const url = getPublicCardUrl(cardId, username)
    await navigator.clipboard.writeText(url)
    alert('Link berhasil disalin!')
  }

  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada kartu bisnis</h3>
        <p className="text-gray-500 mb-4">Buat kartu bisnis digital pertama Anda</p>
        <Link
          href="/dashboard/cards/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Kartu
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map(card => (
        <div key={card.id} className="bg-white rounded-lg shadow overflow-hidden">
          {/* Card Preview */}
          <div className="p-6 border-b">
            <div className="flex items-start gap-4">
              {card.profile_photo_url ? (
                <Image
                  src={card.profile_photo_url}
                  alt={card.full_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {card.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{card.full_name}</h3>
                {card.job_title && (
                  <p className="text-sm text-gray-600 truncate">{card.job_title}</p>
                )}
                {card.company && (
                  <p className="text-sm text-gray-500 truncate">{card.company}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {card.scan_count} scan
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${card.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {card.is_public ? 'Publik' : 'Privat'}
              </span>
            </div>
          </div>

          {/* QR Code Preview */}
          {card.qr_code_url && (
            <div className="p-4 bg-gray-50 flex justify-center">
              <Image
                src={card.qr_code_url}
                alt="QR Code"
                width={120}
                height={120}
                className="w-28 h-28"
                unoptimized
              />
            </div>
          )}

          {/* Actions */}
          <div className="p-4 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/cards/${card.id}`}
              className="flex-1 px-3 py-2 text-center text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Lihat
            </Link>
            <Link
              href={`/dashboard/cards/${card.id}/edit`}
              className="flex-1 px-3 py-2 text-center text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Edit
            </Link>
            <button
              onClick={() => copyLink(card.id, card.username)}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              title="Salin Link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>

            <button
              onClick={() => handleDelete(card.id, card.full_name)}
              disabled={deletingId === card.id}
              className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
              title="Hapus"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
