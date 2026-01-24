'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { createClient } from '@/lib/supabase/client'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function UpgradePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const supabase = createClient() as any

  const [proofUrl, setProofUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pendingPayment, setPendingPayment] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Check if user already has pending payment
    const checkPendingPayment = async () => {
      if (!user) return

      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'PENDING')
        .maybeSingle()

      setPendingPayment(data)
    }

    if (user) {
      checkPendingPayment()
    }
  }, [user, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !proofUrl) return

    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: user.id,
          amount: 25000,
          proof_url: proofUrl,
          status: 'PENDING'
        })

      if (insertError) throw insertError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim bukti pembayaran')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // User is already Pro
  if (user.role === 'PAID_USER' || user.role === 'APP_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white shadow">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Upgrade ke Pro</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-8 text-white text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Anda Sudah Pro! 🎉</h2>
            <p className="text-green-100 mb-6">Nikmati semua fitur premium Official ID</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-white text-green-600 rounded-xl font-medium hover:bg-green-50"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </main>

        <BottomNavigation variant="main" />
      </div>
    )
  }

  // Success state
  if (success || pendingPayment) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white shadow">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Upgrade ke Pro</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Verifikasi</h2>
            <p className="text-gray-600 mb-6">
              Bukti pembayaran Anda sedang diverifikasi oleh admin.
              Proses biasanya memakan waktu 1x24 jam.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </main>

        <BottomNavigation variant="main" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Upgrade ke Pro</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Official ID Pro</h2>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Lifetime</span>
          </div>
          <div className="mb-4">
            <span className="text-4xl font-bold">Rp 25.000</span>
            <span className="text-blue-200 ml-2">sekali bayar</span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Hingga 20 kartu bisnis digital</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Buat organisasi publik & privat</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Download kartu nama siap cetak</span>
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Akses selamanya</span>
            </li>
          </ul>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Cara Pembayaran</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Transfer ke rekening berikut</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">Bank BCA</p>
                  <p className="font-mono font-bold text-lg">1234567890</p>
                  <p className="text-sm text-gray-600">a.n. Official ID</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Upload bukti transfer</p>
                <p className="text-sm text-gray-500">Screenshot atau foto bukti pembayaran</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Tunggu verifikasi</p>
                <p className="text-sm text-gray-500">Admin akan memverifikasi dalam 1x24 jam</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Upload Bukti Pembayaran</h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <ImageUpload
              currentImageUrl={proofUrl}
              onImageUploaded={setProofUrl}
              folder="payments"
              label="Bukti Pembayaran"
            />
          </div>

          <button
            type="submit"
            disabled={!proofUrl || submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
          </button>
        </form>
      </main>

      <BottomNavigation variant="main" />
    </div>
  )
}
