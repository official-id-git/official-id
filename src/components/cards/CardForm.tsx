'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCards } from '@/hooks/useCards'
import { ImageUpload } from '@/components/ui/ImageUpload'
import type { BusinessCard } from '@/types'

interface CardFormProps {
  card?: BusinessCard | null
  mode: 'create' | 'edit'
}

const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/username' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/username' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@username' },
]


import { CardPreview } from '@/components/cards/CardPreview'

const TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Tampilan profesional dengan gradient biru dan animasi fluid',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Desain modern dengan header gradient ungu-pink',
  },
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    description: 'Desain gelap modern dengan aksen emerald',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Tampilan kreatif dengan elemen colorful',
  },
  {
    id: 'minimal_white',
    name: 'Clean White',
    description: 'Sangat bersih dan minimalis',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Elegan dengan nuansa amber dan gold',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Tampilan korporat yang tegas',
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Futuristik dengan aksen neon',
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Artistik dengan background lembut',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Mewah dengan warna hitam dan emas',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Penuh warna dan berenergi',
  },
]

export function CardForm({ card, mode }: CardFormProps) {
  const router = useRouter()
  const { createCard, updateCard, loading, error } = useCards()

  const [formData, setFormData] = useState({
    full_name: card?.full_name || '',
    job_title: card?.job_title || '',
    company: card?.company || '',
    email: card?.email || '',
    phone: card?.phone || '',
    website: card?.website || '',
    address: (card as any)?.address || '',
    city: (card as any)?.city || '',
    profile_photo_url: card?.profile_photo_url || '',
    template: (card as any)?.template || 'professional',
    username: card?.username || '',
    social_links: (card?.social_links as Record<string, string>) || {},
    is_public: card?.is_public ?? true,
    visible_fields: (card?.visible_fields as Record<string, boolean>) || {
      email: true,
      phone: true,
      website: true,
      social_links: true,
      address: true,
      city: true,
    },
  })

  const [formError, setFormError] = useState<string | null>(null)

  // Carousel State
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0)

  // Initialize current index based on selected template
  useState(() => {
    const index = TEMPLATES.findIndex(t => t.id === formData.template)
    if (index >= 0) setCurrentTemplateIndex(index)
  })



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      if (name === 'business_description') {
        setFormData(prev => ({ ...prev, business_description: value }))
        return
      }
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handlePhotoChange = (url: string) => {
    setFormData(prev => ({ ...prev, profile_photo_url: url }))
  }

  const handleTemplateChange = (templateId: string) => {
    setFormData(prev => ({ ...prev, template: templateId }))
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value,
      },
    }))
  }

  const handleVisibleFieldChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      visible_fields: {
        ...prev.visible_fields,
        [field]: checked,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.full_name.trim()) {
      setFormError('Nama lengkap wajib diisi')
      return
    }
    if (!formData.email.trim()) {
      setFormError('Email wajib diisi')
      return
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon wajib diisi')
      return
    }

    try {
      if (mode === 'create') {
        const result = await createCard(formData)
        if (result) {
          router.push('/dashboard/cards')
        }
      } else if (mode === 'edit' && card) {
        const result = await updateCard({ id: card.id, ...formData })
        if (result) {
          router.push(`/dashboard/cards/${card.id}`)
        }
      }
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Display */}
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {formError || error}
        </div>
      )}

      {/* Profile Photo Upload */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Foto Profil</h3>
        <ImageUpload
          value={formData.profile_photo_url}
          onChange={handlePhotoChange}
          label="Upload foto profil Anda"
        />
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dasar</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username / Link Kartu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                official.id/c/
              </div>
              <input
                type="text"
                required
                value={formData.username || ''}
                onChange={async (e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  setFormData({ ...formData, username: val });

                  // Simple validation feedback logic could be added here or onBlur
                  // For now just updating state. Uniqueness check happens on submit or we could add a check button.
                }}
                className="w-full pl-24 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                placeholder="username"
                minLength={3}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kombinasi huruf dan angka, tanpa spasi/simbol. Minimal 3 karakter.
            </p>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jabatan / Posisi
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Contoh: CEO & Founder"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Perusahaan / Bisnis
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Contoh: PT Teknologi Maju"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+62812345678"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.example.com"
            />
          </div>

          {/* Address Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Jl. Sudirman No. 123"
            />
          </div>

          {/* City Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kota
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Jakarta"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Sosial</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SOCIAL_PLATFORMS.map(platform => (
            <div key={platform.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {platform.label}
              </label>
              <input
                type="url"
                value={formData.social_links[platform.key] || ''}
                onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={platform.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Template Selection Carousel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Template Kartu</h3>
        <p className="text-sm text-gray-500 mb-6">Pilih template yang sesuai dengan gaya Anda</p>

        <div className="flex flex-col items-center">
          {/* Carousel Controls */}
          <div className="w-full">
            <div className="overflow-hidden relative flex items-center justify-center py-4">
              {/* Live Preview */}
              <div className="w-full max-w-sm transform scale-100 transition-transform">
                <CardPreview
                  card={{
                    id: 'preview',
                    user_id: 'preview',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    qr_code_url: '',
                    scan_count: 0,
                    ...formData,
                    social_links: formData.social_links // Ensure social links are passed correctly
                  }}
                  readonly={true}
                />
              </div>
            </div>
          </div>

          {/* Template Info */}
          <div className="text-center mt-6">
            <h4 className="text-xl font-bold text-gray-900">
              {TEMPLATES[currentTemplateIndex].name}
            </h4>
            <p className="text-gray-500 mt-1">
              {TEMPLATES[currentTemplateIndex].description}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              {TEMPLATES.map((t, idx) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setCurrentTemplateIndex(idx)
                    setFormData(prev => ({ ...prev, template: TEMPLATES[idx].id }))
                  }}
                  className={`w-2 h-2 rounded-full transition-all focus:outline-none ${idx === currentTemplateIndex ? 'bg-blue-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  aria-label={`Select template ${t.name}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Privasi</h3>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Kartu Publik</span>
              <p className="text-sm text-gray-500">Kartu dapat dilihat oleh siapa saja dengan link</p>
            </div>
          </label>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Tampilkan field berikut di kartu publik:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Telepon' },
                { key: 'website', label: 'Website' },
                { key: 'social_links', label: 'Sosial Media' },
                { key: 'address', label: 'Alamat' },
                { key: 'city', label: 'Kota' },
              ].map(field => (
                <label key={field.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.visible_fields[field.key] ?? true}
                    onChange={(e) => handleVisibleFieldChange(field.key, e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Buat Kartu' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
