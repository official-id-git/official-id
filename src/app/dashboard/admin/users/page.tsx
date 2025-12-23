'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import type { User, UserRole } from '@/types'

export default function UserManagementPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchUsers, updateUserRole, deleteUser, loading } = useAdmin()
  const router = useRouter()
  
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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
    loadUsers()
  }, [page, roleFilter])

  const loadUsers = async () => {
    const result = await fetchUsers(page, limit, search, roleFilter)
    setUsers(result.users)
    setTotal(result.total)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setProcessing(true)
    const success = await updateUserRole(userId, newRole)
    if (success) {
      setMessage({ type: 'success', text: 'Role berhasil diubah' })
      loadUsers()
    } else {
      setMessage({ type: 'error', text: 'Gagal mengubah role' })
    }
    setProcessing(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setProcessing(true)
    const success = await deleteUser(selectedUser.id)
    if (success) {
      setMessage({ type: 'success', text: 'User berhasil dihapus' })
      loadUsers()
    } else {
      setMessage({ type: 'error', text: 'Gagal menghapus user' })
    }
    setProcessing(false)
    setShowModal(false)
    setSelectedUser(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const totalPages = Math.ceil(total / limit)

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'APP_ADMIN':
        return 'bg-red-100 text-red-700'
      case 'PAID_USER':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'APP_ADMIN':
        return 'Admin'
      case 'PAID_USER':
        return 'Pro'
      default:
        return 'Free'
    }
  }

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
              <h1 className="text-2xl font-bold text-gray-900 mt-1">Manajemen User</h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {total} pengguna
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
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | 'ALL')
                setPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Role</option>
              <option value="FREE_USER">Free User</option>
              <option value="PAID_USER">Pro User</option>
              <option value="APP_ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">User</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Terdaftar</th>
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <Image
                              src={u.avatar_url}
                              alt={u.full_name || ''}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {u.full_name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{u.full_name || 'No Name'}</p>
                            <p className="text-sm text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.id !== user.id && u.role !== 'APP_ADMIN' && (
                            <>
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                                disabled={processing}
                                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="FREE_USER">Free</option>
                                <option value="PAID_USER">Pro</option>
                              </select>
                              <button
                                onClick={() => {
                                  setSelectedUser(u)
                                  setShowModal(true)
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Hapus User"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          {u.role === 'APP_ADMIN' && u.id !== user.id && (
                            <span className="text-sm text-gray-400">Admin</span>
                          )}
                          {u.id === user.id && (
                            <span className="text-sm text-gray-400">Anda</span>
                          )}
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
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus User?</h3>
            <p className="text-gray-600 mb-6">
              Yakin ingin menghapus <strong>{selectedUser.full_name}</strong>? 
              Semua data termasuk kartu bisnis akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedUser(null)
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
