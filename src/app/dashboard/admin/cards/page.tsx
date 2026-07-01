'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import type { BusinessCard, User } from '@/types'

export default function CardManagementPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchCards, deleteCard, loading } = useAdmin()
  const router = useRouter()

  const [cards, setCards] = useState<(BusinessCard & { users?: User })[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const limit = 20

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'APP_ADMIN')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadCards()
  }, [page])

  const loadCards = async () => {
    const result = await fetchCards(page, limit, search)
    setCards(result.cards)
    setTotal(result.total)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadCards()
  }

  const handleDelete = async () => {
    if (!selectedCard) return
    setProcessing(true)
    const success = await deleteCard(selectedCard.id)
    if (success) {
      setMessage({ type: 'success', text: 'Kartu berhasil dihapus' })
      loadCards()
    } else {
      setMessage({ type: 'error', text: 'Gagal menghapus kartu' })
    }
    setProcessing(false)
    setShowModal(false)
    setSelectedCard(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const totalPages = Math.ceil(total / limit)

  if (authLoading || !user || user.role !== 'APP_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/dashboard/admin" className="text-sm text-blue-600 hover:text-blue-700">
                ← Kembali ke Admin
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Manajemen Kartu</h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {total} kartu
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama atau perusahaan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>

        {/* Cards Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Info Kartu</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Pemilik</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">URL / Tipe</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : cards.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada kartu ditemukan
                    </td>
                  </tr>
                ) : (
                  cards.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {c.profile_photo_url ? (
                            <Image
                              src={c.profile_photo_url} unoptimized
                              alt={c.full_name || ''}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {c.full_name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{c.full_name}</p>
                            <p className="text-sm text-gray-500">{c.company || 'Personal'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{c.users?.full_name}</p>
                          <p className="text-gray-500">{c.users?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <Link href={`/c/${c.username}`} target="_blank" className="text-blue-600 hover:underline block">
                            /c/{c.username}
                          </Link>
                          <span className="text-gray-500">{c.is_public ? 'Public' : 'Private'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/c/${c.username}`}
                            target="_blank"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Lihat Kartu"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedCard(c)
                              setShowModal(true)
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Hapus Kartu"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-gray-500">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Kartu?</h3>
            <p className="text-gray-600 mb-6">
              Yakin ingin menghapus kartu <strong>{selectedCard.full_name}</strong>?
              Data ini tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedCard(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
