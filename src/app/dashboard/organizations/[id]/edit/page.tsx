'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { OrgForm } from '@/components/organizations/OrgForm'
import type { Organization } from '@/types'

export default function EditOrganizationPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const { fetchOrganization, loading } = useOrganizations()
  const [org, setOrg] = useState<Organization | null>(null)

  const orgId = params.id as string

  useEffect(() => {
    const loadOrg = async () => {
      if (user && orgId) {
        const data = await fetchOrganization(orgId)
        setOrg(data)
      }
    }
    loadOrg()
  }, [user, orgId, fetchOrganization])

  if (authLoading || loading || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/dashboard/organizations/${org.id}`} className="text-sm text-blue-600 hover:text-blue-700">
            ← Kembali ke Detail Circle
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit Circle</h1>
          <p className="text-gray-500 mt-1">Perbarui informasi Circle Anda</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrgForm organization={org} mode="edit" />
      </main>
    </div>
  )
}
