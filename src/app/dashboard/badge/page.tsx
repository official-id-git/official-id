'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import dynamic from 'next/dynamic'

const Badge3D = dynamic(() => import('@/components/badge/Badge3D'), { ssr: false })
import { Facebook, Linkedin, Link as LinkIcon, Loader2, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { BusinessCard } from '@/types'
import { getPublicCardUrl } from '@/lib/qrcode'

export default function BadgeSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchCards, updateCard, loading: cardsLoading } = useCards()
  const router = useRouter()

  const [card, setCard] = useState<BusinessCard | null>(null)
  const [badgeColor, setBadgeColor] = useState('#000000')
  const [lanyardColor, setLanyardColor] = useState('#000000')
  const [isSaving, setIsSaving] = useState(false)
  
  const [publicUrl, setPublicUrl] = useState('')
  const [badgeUrl, setBadgeUrl] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function loadUserCard() {
      if (user) {
        const cards = await fetchCards()
        if (cards && cards.length > 0) {
          const mainCard = cards[0]
          setCard(mainCard)
          // @ts-ignore - badge_color and lanyard_color are newly added
          setBadgeColor(mainCard.badge_color || '#000000')
          // @ts-ignore
          setLanyardColor(mainCard.lanyard_color || '#000000')
          
          const pUrl = getPublicCardUrl(mainCard.id, (mainCard as any).username)
          setPublicUrl(pUrl)
          
          // Badge URL uses /b/username or /b/id
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://official.id'
          const slug = (mainCard as any).username || mainCard.id
          setBadgeUrl(`${baseUrl}/b/${slug}`)
        }
      }
    }
    loadUserCard()
  }, [user, fetchCards])

  const handleSave = async () => {
    if (!card) return
    
    setIsSaving(true)
    try {
      await updateCard({
        id: card.id,
        // @ts-ignore
        badge_color: badgeColor,
        // @ts-ignore
        lanyard_color: lanyardColor
      })
      toast.success('Pengaturan Badge berhasil disimpan!')
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan Badge')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(badgeUrl)
      toast.success('Link disalin ke clipboard!')
    } catch (err) {
      toast.error('Gagal menyalin link')
    }
  }

  if (authLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kartu Nama Belum Tersedia</h2>
          <p className="text-gray-500 mb-6">
            Silakan buat kartu nama digital terlebih dahulu untuk mengakses fitur Interactive 3D Badge.
          </p>
          <Link
            href="/dashboard/cards/new"
            className="w-full inline-flex justify-center items-center py-3 px-6 rounded-xl text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors"
          >
            Buat Kartu Digital
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">3D Event Badge</h1>
          <p className="text-gray-500 text-sm">Sesuaikan dan bagikan lanyard 3D interaktif Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Preview */}
        <div className="bg-gray-900 rounded-3xl overflow-hidden h-[600px] shadow-lg relative border-4 border-gray-800">
          <Badge3D 
            badgeColor={badgeColor} 
            lanyardColor={lanyardColor} 
            user={{ 
              full_name: card.full_name, 
              company: card.company || '',
              job_title: card.job_title || '',
              email: card.email,
              photo_url: card.profile_photo_url || '',
              username: (card as any).username
            }} 
          />
          <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
            <span className="bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full backdrop-blur-md">
              Tarik badge menggunakan kursor/jari
            </span>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Pengaturan Warna</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Tali Lanyard
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={lanyardColor}
                    onChange={(e) => setLanyardColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 font-mono uppercase">{lanyardColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warna Kartu Badge
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 font-mono uppercase">{badgeColor}</span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70 font-medium"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Simpan Pengaturan
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Bagikan Badge</h2>
            
            <div className="flex items-center bg-gray-50 p-3 rounded-xl mb-6">
              <span className="text-sm text-gray-500 truncate flex-1 font-mono pl-2">
                {badgeUrl}
              </span>
              <button 
                onClick={copyToClipboard}
                className="ml-2 p-2 bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50"
                title="Copy Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(badgeUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0A66C2] text-white rounded-xl hover:bg-[#004182] transition-colors font-medium"
              >
                <Linkedin className="w-5 h-5" />
                <span>LinkedIn</span>
              </a>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(badgeUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#1877F2] text-white rounded-xl hover:bg-[#0c5bbf] transition-colors font-medium"
              >
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
