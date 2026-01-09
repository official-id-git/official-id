'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import type { PaymentTransaction, PaymentStatus, User } from '@/types'

interface PaymentWithUser extends PaymentTransaction {
  users?: User
}

export default function PaymentVerificationPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchPayments, approvePayment, rejectPayment, loading } = useAdmin()
  const router = useRouter()

  const [payments, setPayments] = useState<PaymentWithUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('PENDING')
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithUser | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve')
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showProofModal, setShowProofModal] = useState(false)

  const limit = 20

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'APP_ADMIN')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadPayments()
  }, [page, statusFilter])

  const loadPayments = async () => {
    const result = await fetchPayments(page, limit, statusFilter)
    setPayments(result.payments)
    setTotal(result.total)
  }

  const handleApprove = async () => {
    if (!selectedPayment || !user) return
    setProcessing(true)
    const success = await approvePayment(selectedPayment.id, selectedPayment.user_id, user.id)
    if (success) {
      setMessage({ type: 'success', text: 'Pembayaran disetujui. User telah di-upgrade ke Pro.' })
      loadPayments()
    } else {
      setMessage({ type: 'error', text: 'Gagal menyetujui pembayaran' })
    }
    setProcessing(false)
    setShowModal(false)
    setSelectedPayment(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const handleReject = async () => {
    if (!selectedPayment || !user) return
    setProcessing(true)
    const success = await rejectPayment(selectedPayment.id, user.id, rejectReason)
    if (success) {
      setMessage({ type: 'success', text: 'Pembayaran ditolak' })
      loadPayments()
    } else {
      setMessage({ type: 'error', text: 'Gagal menolak pembayaran' })
    }
    setProcessing(false)
    setShowModal(false)
    setSelectedPayment(null)
    setRejectReason('')
    setTimeout(() => setMessage(null), 3000)
  }

  const openActionModal = (payment: PaymentWithUser, action: 'approve' | 'reject') => {
    setSelectedPayment(payment)
    setModalAction(action)
    setShowModal(true)
  }

  const totalPages = Math.ceil(total / limit)

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700'
      case 'REJECTED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'Disetujui'
      case 'REJECTED':
        return 'Ditolak'
      default:
        return 'Pending'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <Link href="/dashboard/admin" className="text-sm text-blue-600 hover:text-blue-700">
                ← Kembali ke Admin
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Verifikasi Pembayaran</h1>
            </div>
            <div className="text-sm text-gray-500">
              Total: {total} transaksi
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

        {/* Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status === 'ALL' ? 'Semua' : getStatusLabel(status as PaymentStatus)}
              </button>
            ))}
          </div>
        </div>

        {/* Payment List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">Tidak ada pembayaran ditemukan</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
                {/* Mobile-first card layout */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* User Info Section */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* User Avatar */}
                    {payment.users?.avatar_url ? (
                      <Image
                        src={payment.users.avatar_url}
                        alt={payment.users.full_name || ''}
                        width={48}
                        height={48}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-medium text-base sm:text-lg">
                          {payment.users?.full_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{payment.users?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 truncate">{payment.users?.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(payment.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Actions Section - Full width on mobile */}
                  <div className="flex flex-col gap-3 sm:items-end w-full sm:w-auto">
                    {/* Proof Image Button */}
                    {payment.proof_url && (
                      <button
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowProofModal(true)
                        }}
                        className="w-full sm:w-auto text-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium rounded-xl text-sm transition-colors"
                      >
                        Lihat Bukti →
                      </button>
                    )}

                    {/* Action Buttons */}
                    {payment.status === 'PENDING' && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => openActionModal(payment, 'approve')}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => openActionModal(payment, 'reject')}
                          className="flex-1 sm:flex-none px-4 py-2.5 border border-red-300 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {payment.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">{payment.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Action Confirmation Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {modalAction === 'approve' ? 'Setujui Pembayaran?' : 'Tolak Pembayaran?'}
            </h3>

            {modalAction === 'approve' ? (
              <p className="text-gray-600 mb-6">
                Pembayaran dari <strong>{selectedPayment.users?.full_name}</strong> sebesar{' '}
                <strong>{formatCurrency(selectedPayment.amount)}</strong> akan disetujui dan user akan di-upgrade ke Pro.
              </p>
            ) : (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Pembayaran dari <strong>{selectedPayment.users?.full_name}</strong> akan ditolak.
                </p>
                <textarea
                  placeholder="Alasan penolakan (opsional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedPayment(null)
                  setRejectReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={modalAction === 'approve' ? handleApprove : handleReject}
                disabled={processing}
                className={`flex-1 px-4 py-2 text-white rounded-xl disabled:opacity-50 ${modalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {processing ? 'Memproses...' : modalAction === 'approve' ? 'Setujui' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Modal */}
      {showProofModal && selectedPayment?.proof_url && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowProofModal(false)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedPayment.proof_url}
              alt="Bukti Pembayaran"
              className="w-full rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
