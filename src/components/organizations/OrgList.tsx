'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useOrganizations } from '@/hooks/useOrganizations'
import type { Organization } from '@/types'

interface OrgListProps {
  organizations: Organization[]
  onDelete?: (id: string) => void
  showActions?: boolean
}

export function OrgList({ organizations, onDelete, showActions = true }: OrgListProps) {
  const { deleteOrganization } = useOrganizations()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus organisasi "${name}"? Semua anggota akan dihapus.`)) return
    
    setDeletingId(id)
    const success = await deleteOrganization(id)
    if (success && onDelete) {
      onDelete(id)
    }
    setDeletingId(null)
  }

  if (organizations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada organisasi</h3>
        <p className="text-gray-500 mb-4">Buat organisasi pertama Anda</p>
        {showActions && (
          <Link
            href="/dashboard/organizations/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Organisasi
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {organizations.map(org => (
        <div key={org.id} className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {org.logo_url ? (
                <Image
                  src={org.logo_url} unoptimized
                  alt={org.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                {org.category && (
                  <p className="text-sm text-gray-500">{org.category}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${org.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {org.is_public ? 'Publik' : 'Privat'}
                  </span>
                  {org.require_approval && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                      Perlu Approval
                    </span>
                  )}
                </div>
              </div>
            </div>

            {org.description && (
              <p className="mt-4 text-sm text-gray-600 line-clamp-2">{org.description}</p>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="px-6 pb-6 flex gap-2">
              <Link
                href={`/dashboard/organizations/${org.id}`}
                className="flex-1 px-3 py-2 text-center text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Lihat
              </Link>
              <Link
                href={`/dashboard/organizations/${org.id}/edit`}
                className="flex-1 px-3 py-2 text-center text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(org.id, org.name)}
                disabled={deletingId === org.id}
                className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                title="Hapus"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
