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

import { useSecurity } from '@/hooks/useSecurity'

export function OrgForm({ organization, mode }: OrgFormProps) {
  const router = useRouter()
  const { createOrganization, updateOrganization, loading, error, generateRandomUsername, checkUsernameAvailability } = useOrganizations()
  const { validateInput } = useSecurity()

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    logo_url: organization?.logo_url || '',
    category: organization?.category || '',
    username: organization?.username || '',
    is_public: organization?.is_public ?? true,
    require_approval: organization?.require_approval ?? true,
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    // Handle checkbox separately - no security check needed for boolean toggle
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
      return
    }

    // Security Check for text inputs
    const isValid = await validateInput(value)
    if (!isValid) return // Block input if potentially malicious

    setFormData(prev => ({ ...prev, [name]: value }))
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

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Security Check
    const isValid = await validateInput(value)
    if (!isValid) return

    setFormData(prev => ({ ...prev, username: value }))

    // Check availability if length is valid (3-20 characters)
    if (value.length >= 3 && value.length <= 20) {
      setCheckingUsername(true)
      const isAvailable = await checkUsernameAvailability(value, organization?.id)
      setUsernameAvailable(isAvailable)
      setCheckingUsername(false)
    } else {
      setUsernameAvailable(null)
    }
  }

  const generateUsername = async () => {
    const newUsername = generateRandomUsername()
    setFormData(prev => ({ ...prev, username: newUsername }))
    const isAvailable = await checkUsernameAvailability(newUsername, organization?.id)
    setUsernameAvailable(isAvailable)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.name.trim()) {
      setFormError('Nama Circle wajib diisi')
      return
    }

    if (!formData.username || formData.username.length < 3 || formData.username.length > 20) {
      setFormError('Username harus 3-20 karakter')
      return
    }

    // Validate alphanumeric only
    if (!/^[a-z0-9]+$/.test(formData.username)) {
      setFormError('Username hanya boleh huruf kecil dan angka (a-z, 0-9)')
      return
    }

    if (usernameAvailable === false) {
      setFormError('Username sudah digunakan')
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username Circle <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9]+"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="contoh: kabayangroup"
                  required
                />
                {formData.username && (
                  <div className="mt-1 text-sm">
                    {checkingUsername ? (
                      <span className="text-gray-500">Memeriksa...</span>
                    ) : usernameAvailable === true ? (
                      <span className="text-green-600">✓ Username tersedia</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-red-600">✗ Username sudah digunakan</span>
                    ) : formData.username.length < 3 ? (
                      <span className="text-orange-600">Minimal 3 karakter</span>
                    ) : formData.username.length > 20 ? (
                      <span className="text-orange-600">Maksimal 20 karakter</span>
                    ) : (
                      <span className="text-gray-500">{formData.username.length} karakter</span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={generateUsername}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                title="Generate username acak 7 karakter"
              >
                Generate
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Link publik: <span className="font-mono text-blue-600">official.id/o/{formData.username || '...'}</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              3-20 karakter, hanya huruf kecil dan angka (a-z, 0-9)
            </p>
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
