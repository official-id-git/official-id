'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useNgabsen } from '@/hooks/useNgabsen'
import { motion } from 'motion/react'

export default function CreateNgabsenPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { createNgabsen, loading, error, isPro, clearError } = useNgabsen()

    const [formData, setFormData] = useState({
        nama_acara: '',
        deskripsi_acara: ''
    })
    const [success, setSuccess] = useState<{
        pendaftaran: string
        daftarPeserta: string
    } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()

        const result = await createNgabsen({
            nama_acara: formData.nama_acara,
            deskripsi_acara: formData.deskripsi_acara || null
        })

        if (result && result.link_ngabsen) {
            const baseUrl = window.location.origin
            setSuccess({
                pendaftaran: `${baseUrl}/ngabsen/${result.link_ngabsen.link_pendaftaran}`,
                daftarPeserta: `${baseUrl}/ngabsen/peserta/${result.link_ngabsen.link_daftar_peserta}`
            })
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!isPro) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-md mx-auto text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Fitur Premium</h1>
                    <p className="text-gray-600 mb-6">
                        Upgrade akun Anda untuk mengakses fitur Ngabsen.
                    </p>
                    <Link
                        href="/dashboard/upgrade"
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold"
                    >
                        Upgrade Sekarang
                    </Link>
                </div>
            </div>
        )
    }

    // Success State
    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-lg mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 border border-gray-200"
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acara Berhasil Dibuat!</h1>
                            <p className="text-gray-600">Bagikan link berikut kepada peserta Anda</p>
                        </div>

                        <div className="space-y-4">
                            {/* Registration Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link Form Pendaftaran
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={success.pendaftaran}
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(success.pendaftaran)}
                                        className="px-4 py-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Bagikan link ini agar peserta dapat mengisi form daftar hadir
                                </p>
                            </div>

                            {/* Attendee List Link */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link Daftar Peserta
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={success.daftarPeserta}
                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(success.daftarPeserta)}
                                        className="px-4 py-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Bagikan link ini agar peserta dapat melihat daftar yang sudah mendaftar
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Link
                                href="/dashboard/ngabsen"
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 text-center rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Kembali
                            </Link>
                            <button
                                onClick={() => {
                                    setSuccess(null)
                                    setFormData({ nama_acara: '', deskripsi_acara: '' })
                                }}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all"
                            >
                                Buat Lagi
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/dashboard/ngabsen"
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Buat Acara Ngabsen</h1>
                        <p className="text-gray-600 text-sm">Isi detail acara untuk membuat link pendaftaran</p>
                    </div>
                </div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl p-6 border border-gray-200"
                >
                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={clearError} className="text-red-500 hover:text-red-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Nama Acara */}
                        <div>
                            <label htmlFor="nama_acara" className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Acara <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="nama_acara"
                                name="nama_acara"
                                value={formData.nama_acara}
                                onChange={handleChange}
                                required
                                placeholder="Contoh: Rapat Koordinasi Bulanan"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Deskripsi Acara */}
                        <div>
                            <label htmlFor="deskripsi_acara" className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi Acara <span className="text-gray-400">(opsional)</span>
                            </label>
                            <textarea
                                id="deskripsi_acara"
                                name="deskripsi_acara"
                                value={formData.deskripsi_acara}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Tambahkan informasi tempat, waktu, atau keterangan lainnya"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !formData.nama_acara}
                        className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Membuat...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Buat Link Ngabsen
                            </>
                        )}
                    </button>
                </motion.form>
            </div>
        </div>
    )
}
