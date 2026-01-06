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

const TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Tampilan profesional dengan gradient biru dan animasi fluid',
    preview: (
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-16 h-16 bg-blue-400 rounded-full filter blur-xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-blue-300 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative text-center">
          <div className="w-10 h-10 bg-white/30 rounded-full mx-auto mb-2 border-2 border-white/50" />
          <div className="h-2 bg-white/70 rounded w-16 mx-auto mb-1" />
          <div className="h-1.5 bg-white/50 rounded w-12 mx-auto" />
        </div>
      </div>
    ),
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Desain modern dengan header gradient ungu-pink',
    preview: (
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="h-8 bg-gradient-to-r from-purple-500 to-pink-500" />
        <div className="p-3 text-center -mt-4">
          <div className="w-8 h-8 bg-gray-200 rounded-xl mx-auto border-2 border-white shadow" />
          <div className="h-2 bg-gray-300 rounded w-14 mx-auto mt-2" />
          <div className="h-1.5 bg-gray-200 rounded w-10 mx-auto mt-1" />
        </div>
      </div>
    ),
  },
  {
    id: 'modern_dark',
    name: 'Modern Dark',
    description: 'Desain gelap modern dengan aksen emerald',
    preview: (
      <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
        <div className="h-8 bg-gradient-to-r from-emerald-400 to-cyan-500" />
        <div className="p-3 text-center -mt-4">
          <div className="w-8 h-8 bg-slate-900 rounded-xl mx-auto border-2 border-slate-800 shadow" />
          <div className="h-2 bg-white/20 rounded w-14 mx-auto mt-2" />
          <div className="h-1.5 bg-white/10 rounded w-10 mx-auto mt-1" />
        </div>
      </div>
    ),
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Tampilan kreatif dengan elemen colorful',
    preview: (
      <div className="bg-white rounded-lg overflow-hidden border border-gray-100 relative">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full filter blur-xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full filter blur-xl opacity-30" />
        <div className="p-4 relative text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-lg mx-auto mb-2" />
          <div className="h-2 bg-gray-200 rounded w-14 mx-auto mb-1" />
          <div className="h-1.5 bg-gray-100 rounded w-10 mx-auto" />
        </div>
      </div>
    ),
  },
  {
    id: 'minimal_white',
    name: 'Clean White',
    description: 'Sangat bersih dan minimalis',
    preview: (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="text-center">
          <div className="w-8 h-8 bg-gray-900 rounded-full mx-auto mb-2" />
          <div className="h-2 bg-gray-900 rounded w-14 mx-auto mb-1" />
          <div className="h-1.5 bg-gray-400 rounded w-10 mx-auto" />
        </div>
      </div>
    ),
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Elegan dengan nuansa amber dan gold',
    preview: (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg overflow-hidden border border-amber-100">
        <div className="h-8 bg-gradient-to-r from-amber-700 to-orange-800 opacity-80" />
        <div className="p-3 text-center -mt-4">
          <div className="w-8 h-8 bg-amber-600 rounded-full mx-auto border-2 border-white shadow" />
          <div className="h-2 bg-amber-800/20 rounded w-14 mx-auto mt-2" />
          <div className="h-1.5 bg-amber-800/10 rounded w-10 mx-auto mt-1" />
        </div>
      </div>
    ),
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Tampilan korporat yang tegas',
    preview: (
      <div className="bg-white rounded-lg overflow-hidden border-t-4 border-gray-900 shadow-sm">
        <div className="p-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-800 rounded-sm" />
            <div className="w-12 h-2 bg-gray-300 rounded" />
          </div>
        </div>
        <div className="p-3 space-y-1">
          <div className="w-full h-1.5 bg-gray-100 rounded" />
          <div className="w-full h-1.5 bg-gray-100 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Futuristik dengan aksen neon',
    preview: (
      <div className="bg-gray-950 rounded-lg overflow-hidden border border-cyan-500/30">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />
        <div className="p-3 text-center">
          <div className="w-8 h-8 bg-gray-900 rounded-lg mx-auto border border-cyan-500/50 text-cyan-500 flex items-center justify-center text-xs ml-auto mr-auto">
            ID
          </div>
          <div className="h-2 bg-cyan-900/30 rounded w-14 mx-auto mt-2" />
        </div>
      </div>
    ),
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Artistik dengan background lembut',
    preview: (
      <div className="bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-indigo-400" />
        <div className="text-center relative z-10">
          <div className="w-8 h-8 bg-white/50 backdrop-blur rounded-full mx-auto mb-2" />
          <div className="h-2 bg-purple-900/10 rounded w-14 mx-auto mb-1" />
        </div>
      </div>
    ),
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Mewah dengan warna hitam dan emas',
    preview: (
      <div className="bg-gray-900 rounded-lg p-4 border border-yellow-600/30">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border border-yellow-500 mx-auto mb-2" />
          <div className="h-2 bg-yellow-600 rounded w-14 mx-auto mb-1" />
          <div className="h-1.5 bg-gray-700 rounded w-10 mx-auto" />
        </div>
      </div>
    ),
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Penuh warna dan berenergi',
    preview: (
      <div className="bg-white rounded-lg p-4 border border-pink-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 opacity-50" />
        <div className="relative text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-500 rounded-xl mx-auto mb-2" />
          <div className="h-2 bg-gray-800/10 rounded w-14 mx-auto" />
        </div>
      </div>
    ),
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
    profile_photo_url: card?.profile_photo_url || '',
    template: (card as any)?.template || 'professional',
    social_links: (card?.social_links as Record<string, string>) || {},
    is_public: card?.is_public ?? true,
    visible_fields: (card?.visible_fields as Record<string, boolean>) || {
      email: true,
      phone: true,
      website: true,
      social_links: true,
    },
  })

  const [formError, setFormError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jabatan
            </label>
            <input
              type="text"
              name="job_title"
              value={formData.job_title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Software Engineer"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perusahaan
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PT. Contoh Indonesia"
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

      {/* Template Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pilih Template Kartu</h3>
        <p className="text-sm text-gray-500 mb-4">Pilih satu template untuk kartu bisnis Anda</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map(template => (
            <label
              key={template.id}
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${formData.template === template.id
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-offset-2'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={formData.template === template.id}
                onChange={() => handleTemplateChange(template.id)}
                className="sr-only"
              />

              {/* Checkmark */}
              {formData.template === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Preview */}
              <div className="mb-3">
                {template.preview}
              </div>

              {/* Info */}
              <h4 className={`font-semibold ${formData.template === template.id ? 'text-blue-700' : 'text-gray-900'}`}>
                {template.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
            </label>
          ))}
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
