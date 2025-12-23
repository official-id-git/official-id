'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCards } from '@/hooks/useCards'
import BottomNavigation from '@/components/layout/BottomNavigation'
import { ImageUpload } from '@/components/ui/ImageUpload'
import Link from 'next/link'

type Template = 'professional' | 'modern' | 'minimal'

export default function NewCardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { createCard, fetchCards, loading: cardLoading } = useCards()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('professional')
  const [existingCardsCount, setExistingCardsCount] = useState<number>(0)
  const [checkingCards, setCheckingCards] = useState(true)
  
  const [formData, setFormData] = useState({
    full_name: '',
    job_title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    facebook_url: '',
    github_url: '',
    youtube_url: '',
    tiktok_url: '',
    is_public: true,
    show_email: true,
    show_phone: true,
    show_website: true,
    show_social: true,
  })
  
  const [profilePhoto, setProfilePhoto] = useState<string>('')

  // Check existing cards count for FREE_USER
  useEffect(() => {
    const checkCards = async () => {
      if (user) {
        setCheckingCards(true)
        try {
          const cards = await fetchCards()
          setExistingCardsCount(cards.length)
          // Pre-fill email from user
          setFormData(prev => ({ ...prev, email: user.email || '' }))
        } catch (err) {
          console.error('Error checking cards:', err)
        } finally {
          setCheckingCards(false)
        }
      }
    }
    checkCards()
  }, [user])

  // Check if FREE_USER already has a card
  const isFreeUserWithCard = user?.role === 'FREE_USER' && existingCardsCount >= 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Check card limit for FREE_USER
    if (user?.role === 'FREE_USER' && existingCardsCount >= 1) {
      setError('Akun gratis hanya dapat membuat 1 kartu. Upgrade ke Pro untuk membuat lebih banyak kartu.')
      return
    }

    setIsLoading(true)

    try {
      // Build social_links object from individual fields
      const social_links: Record<string, string> = {}
      if (formData.linkedin_url) social_links.linkedin = formData.linkedin_url
      if (formData.twitter_url) social_links.twitter = formData.twitter_url
      if (formData.instagram_url) social_links.instagram = formData.instagram_url
      if (formData.facebook_url) social_links.facebook = formData.facebook_url
      if (formData.github_url) social_links.github = formData.github_url
      if (formData.youtube_url) social_links.youtube = formData.youtube_url
      if (formData.tiktok_url) social_links.tiktok = formData.tiktok_url

      // Build visible_fields object
      const visible_fields = {
        email: formData.show_email,
        phone: formData.show_phone,
        website: formData.show_website,
        social_links: formData.show_social,
      }

      const cardData = {
        full_name: formData.full_name,
        job_title: formData.job_title || undefined,
        company: formData.company || undefined,
        email: formData.email,
        phone: formData.phone,
        website: formData.website || undefined,
        profile_photo_url: profilePhoto || undefined,
        template: selectedTemplate,
        social_links,
        is_public: formData.is_public,
        visible_fields,
      }
      
      const newCard = await createCard(cardData)
      
      // Check if card was created successfully
      if (newCard && newCard.id) {
        router.push(`/dashboard/cards/${newCard.id}`)
      } else {
        setError('Gagal membuat kartu. Silakan coba lagi.')
      }
    } catch (err: any) {
      // Handle specific errors
      if (err.message?.includes('FREE_USER') || err.message?.includes('409')) {
        setError('Akun gratis hanya dapat membuat 1 kartu. Upgrade ke Pro untuk membuat lebih banyak kartu.')
      } else {
        setError(err.message || 'Gagal membuat kartu')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const templates = [
    { 
      id: 'professional' as Template, 
      name: 'Professional',
      preview: (
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-3 text-white text-center">
          <div className="w-8 h-8 bg-white/30 rounded-full mx-auto mb-1"></div>
          <div className="h-2 bg-white/50 rounded w-16 mx-auto mb-1"></div>
          <div className="h-1.5 bg-white/30 rounded w-12 mx-auto"></div>
        </div>
      )
    },
    { 
      id: 'modern' as Template, 
      name: 'Modern',
      preview: (
        <div className="bg-white rounded-lg overflow-hidden border">
          <div className="h-4 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <div className="p-2 text-center">
            <div className="w-6 h-6 bg-gray-200 rounded-lg mx-auto -mt-4 border-2 border-white"></div>
            <div className="h-1.5 bg-gray-300 rounded w-12 mx-auto mt-1"></div>
          </div>
        </div>
      )
    },
    { 
      id: 'minimal' as Template, 
      name: 'Minimal',
      preview: (
        <div className="bg-gray-100 rounded-lg p-3 border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <div>
              <div className="h-1.5 bg-gray-400 rounded w-10 mb-1"></div>
              <div className="h-1 bg-gray-300 rounded w-8"></div>
            </div>
          </div>
        </div>
      )
    },
  ]

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

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Template Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Pilih Template Desain</h2>
          <div className="grid grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  selectedTemplate === template.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {template.preview}
                <p className={`text-sm mt-2 font-medium ${
                  selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {template.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Foto Profil</h2>
          <p className="text-gray-500 text-sm mb-4">Upload foto profil Anda</p>
          <ImageUpload
            value={profilePhoto}
            onChange={setProfilePhoto}
            className="w-32 h-32"
          />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Informasi Dasar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Jabatan</label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="Software Engineer"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Perusahaan</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="PT. Contoh Indonesia"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Informasi Kontak</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+62812345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Media Sosial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Twitter/X</label>
              <input
                type="url"
                value={formData.twitter_url}
                onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                placeholder="https://twitter.com/username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Instagram</label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Facebook</label>
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">GitHub</label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">YouTube</label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://youtube.com/@channel"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">TikTok</label>
              <input
                type="url"
                value={formData.tiktok_url}
                onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@username"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Pengaturan Privasi</h2>
          
          <label className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <div>
              <p className="font-medium text-gray-900">Kartu Publik</p>
              <p className="text-sm text-gray-500">Kartu dapat dilihat oleh siapa saja dengan link</p>
            </div>
          </label>

          <p className="text-sm text-gray-700 mb-3">Tampilkan field berikut di kartu publik:</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_email}
                onChange={(e) => setFormData({ ...formData, show_email: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-700">Email</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_phone}
                onChange={(e) => setFormData({ ...formData, show_phone: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-700">Telepon</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_website}
                onChange={(e) => setFormData({ ...formData, show_website: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-700">Website</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_social}
                onChange={(e) => setFormData({ ...formData, show_social: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className="text-sm text-gray-700">Sosial Media</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Menyimpan...' : 'Buat Kartu'}
          </button>
        </div>
      </form>

      {/* Bottom Navigation */}
      <BottomNavigation variant="cards" />
    </div>
  )
}
