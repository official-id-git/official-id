'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import { CardPreview } from '@/components/cards/CardPreview'
import { getPublicCardUrl } from '@/lib/qrcode'
import { downloadBusinessCard } from '@/lib/cardDownload'
import type { BusinessCard } from '@/types'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function CardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { fetchCard, deleteCard, regenerateQRCode, loading } = useCards()
  const [card, setCard] = useState<BusinessCard | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [shareResult, setShareResult] = useState<{ success: boolean; message: string } | null>(null)

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

  const handleDelete = async () => {
    if (!card) return
    if (!confirm(`Yakin ingin menghapus kartu "${card.full_name}"?`)) return
    
    const success = await deleteCard(card.id)
    if (success) {
      router.push('/dashboard/cards')
    }
  }

  const handleShareEmail = async () => {
    if (!card || !shareEmail || !user) return
    setSending(true)
    setShareResult(null)

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'share_card',
          data: {
            senderName: user.full_name,
            senderEmail: user.email,
            recipientEmail: shareEmail,
            cardName: card.full_name,
            cardTitle: card.job_title,
            cardCompany: card.company,
            cardUrl: getPublicCardUrl(card.id),
            message: shareMessage || undefined
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShareResult({ success: true, message: 'Email berhasil dikirim!' })
        setShareEmail('')
        setShareMessage('')
        setTimeout(() => {
          setShowShareModal(false)
          setShareResult(null)
        }, 2000)
      } else {
        setShareResult({ success: false, message: result.error || 'Gagal mengirim email' })
      }
    } catch (error) {
      setShareResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setSending(false)
    }
  }

  const handleDownloadCard = async () => {
    if (!card) return
    setDownloading(true)
    try {
      await downloadBusinessCard(card)
    } catch (error) {
      console.error('Download error:', error)
      alert('Gagal mengunduh kartu nama')
    } finally {
      setDownloading(false)
    }
  }

  const handleRegenerateQR = async () => {
    if (!card) return
    const newQR = await regenerateQRCode(card.id)
    if (newQR) {
      setCard(prev => prev ? { ...prev, qr_code_url: newQR } : null)
    }
  }

  const copyLink = async () => {
    if (!card) return
    const url = getPublicCardUrl(card.id)
    await navigator.clipboard.writeText(url)
    alert('Link berhasil disalin!')
  }

  if (authLoading || loading || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  const publicUrl = getPublicCardUrl(card.id)
  const socialLinks = (card.social_links as Record<string, string>) || {}
  const template = card.template || 'professional'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header - Simplified */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">{card.full_name}</h1>
            <div className="flex gap-2">
              <Link
                href={`/dashboard/cards/${card.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Card Preview Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview Kartu</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full capitalize">
              {template}
            </span>
          </div>
          <CardPreview card={card} template={template as 'professional' | 'modern' | 'minimal'} />
        </div>

        {/* Public Link - Moved under preview */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Link Publik</h2>
          <div className="bg-gray-100 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 break-all font-mono">{publicUrl}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Salin Link
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Buka
            </a>
          </div>
        </div>

        {/* QR Code & Download */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">QR Code & Unduh</h2>
          {card.qr_code_url ? (
            <div className="flex flex-col items-center">
              <Image
                src={card.qr_code_url}
                alt="QR Code"
                width={180}
                height={180}
                className="mb-4 rounded-lg"
              />
              <div className="flex gap-3 w-full max-w-sm">
                <button
                  onClick={handleDownloadCard}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {downloading ? 'Mengunduh...' : 'Unduh Kartu'}
                </button>
                <button
                  onClick={handleRegenerateQR}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                  title="Regenerate QR"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Unduh kartu nama ukuran standar (85.6mm x 53.98mm)
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">QR Code belum dibuat</p>
              <button
                onClick={handleRegenerateQR}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Buat QR Code
              </button>
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kartu</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
              <p className="font-medium text-gray-900">{card.full_name}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Jabatan</p>
              <p className="font-medium text-gray-900">{card.job_title || '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Perusahaan</p>
              <p className="font-medium text-gray-900">{card.company || '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-medium text-gray-900 text-sm break-all">{card.email}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Telepon</p>
              <p className="font-medium text-gray-900">{card.phone}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Website</p>
              <p className="font-medium text-gray-900 text-sm break-all">{card.website || '-'}</p>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {Object.keys(socialLinks).filter(k => socialLinks[k]).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media Sosial</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-xs text-gray-500 capitalize mb-1">{platform}</p>
                    <p className="font-medium text-blue-600 text-sm truncate">{url}</p>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistik</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{card.scan_count}</p>
              <p className="text-xs text-gray-600 mt-1">Total Scan</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {card.is_public ? 'Ya' : 'Tidak'}
              </p>
              <p className="text-xs text-gray-600 mt-1">Publik</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <p className="text-lg font-bold text-purple-600">
                {new Date(card.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </p>
              <p className="text-xs text-gray-600 mt-1">Dibuat</p>
            </div>
          </div>
        </div>

        {/* Quick Share Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bagikan</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Lihat kartu bisnis saya: ${publicUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* Share Email Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Kirim via Email</h3>
              <button 
                onClick={() => {
                  setShowShareModal(false)
                  setShareResult(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {shareResult ? (
              <div className={`p-4 rounded-xl mb-4 ${shareResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {shareResult.message}
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Penerima *</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pesan (Opsional)</label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Tulis pesan singkat..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={handleShareEmail}
                disabled={!shareEmail || sending}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Kirim Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation variant="cards" />
    </div>
  )
}
