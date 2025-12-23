'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { OrgForm } from '@/components/organizations/OrgForm'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NewOrganizationPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role === 'FREE_USER') {
      alert('Hanya pengguna berbayar yang dapat membuat organisasi')
      router.push('/dashboard/organizations')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (user?.role === 'FREE_USER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard/organizations" className="text-sm text-blue-600 hover:text-blue-700">
            ← Kembali ke Daftar Organisasi
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Buat Organisasi Baru</h1>
          <p className="text-gray-500 mt-1">Isi informasi untuk organisasi Anda</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrgForm mode="create" />
      </main>
    </div>
  )
}
