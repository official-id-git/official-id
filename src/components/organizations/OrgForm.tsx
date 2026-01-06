'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganizations } from '@/hooks/useOrganizations'
import { ImageUpload } from '@/components/ui/ImageUpload'
import type { Organization } from '@/types'

interface OrgFormProps {
  organization?: Organization | null
  mode: 'create' | 'edit'
}

const CATEGORIES = [
  'Teknologi',
  'Pendidikan',
  'Kesehatan',
  'Keuangan',
  'Pemerintahan',
  'Non-Profit',
  'Retail',
  'Manufaktur',
  'Jasa',
  'Lainnya',
]

export function OrgForm({ organization, mode }: OrgFormProps) {
  const router = useRouter()
  const { createOrganization, updateOrganization, loading, error } = useOrganizations()

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    logo_url: organization?.logo_url || '',
    category: organization?.category || '',
    is_public: organization?.is_public ?? true,
    require_approval: organization?.require_approval ?? true,
  })

  const [formError, setFormError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleVisibilityChange = (isPublic: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_public: isPublic,
      // Private org always requires approval (via invitation)
      require_approval: isPublic ? prev.require_approval : true
    }))
  }

  const handleLogoChange = (url: string) => {
    setFormData(prev => ({ ...prev, logo_url: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.name.trim()) {
      setFormError('Nama Circle wajib diisi')
      return
    }

    try {
      if (mode === 'create') {
        const result = await createOrganization(formData)
        if (result) {
          router.push('/dashboard/organizations')
        }
      } else if (mode === 'edit' && organization) {
        const result = await updateOrganization({ id: organization.id, ...formData })
        if (result) {
          router.push(`/dashboard/organizations/${organization.id}`)
        }
      }
    } catch (err: any) {
      setFormError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {formError || error}
        </div>
      )}

      {/* Logo Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo Circle</h3>
        <ImageUpload
          value={formData.logo_url}
          onChange={handleLogoChange}
          label="Upload logo Circle"
        />
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Circle</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Circle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PT. Contoh Indonesia"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Deskripsi singkat tentang Circle..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Pilih Kategori</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visibility Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visibilitas Circle</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Public Option */}
          <button
            type="button"
            onClick={() => handleVisibilityChange(true)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${formData.is_public
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${formData.is_public ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                <svg className={`w-5 h-5 ${formData.is_public ? 'text-blue-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${formData.is_public ? 'text-blue-900' : 'text-gray-900'}`}>
                  Publik
                </p>
                <p className={`text-sm mt-0.5 ${formData.is_public ? 'text-blue-700' : 'text-gray-500'}`}>
                  Siapa saja dapat melihat dan bergabung dengan Circle ini
                </p>
              </div>
            </div>
          </button>

          {/* Private Option */}
          <button
            type="button"
            onClick={() => handleVisibilityChange(false)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${!formData.is_public
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${!formData.is_public ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                <svg className={`w-5 h-5 ${!formData.is_public ? 'text-purple-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${!formData.is_public ? 'text-purple-900' : 'text-gray-900'}`}>
                  Privat
                </p>
                <p className={`text-sm mt-0.5 ${!formData.is_public ? 'text-purple-700' : 'text-gray-500'}`}>
                  Hanya yang diundang via email yang dapat bergabung
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Private Org Info */}
        {!formData.is_public && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">Circle Privat</p>
                <ul className="list-disc list-inside space-y-1 text-purple-700">
                  <li>Tidak muncul di direktori publik</li>
                  <li>Anggota harus diundang via email</li>
                  <li>Hanya anggota yang dapat melihat detail Circle</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Approval Settings (only for public) */}
        {formData.is_public && (
          <div className="mt-4 pt-4 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="require_approval"
                checked={formData.require_approval}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Perlu Persetujuan Admin</span>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formData.require_approval
                    ? 'Anggota baru harus disetujui oleh admin sebelum bergabung'
                    : 'Siapa saja dapat langsung bergabung tanpa persetujuan'}
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Menyimpan...' : mode === 'create' ? 'Buat Circle' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}
