'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useNgabsen, Ngabsen, Pendaftaran } from '@/hooks/useNgabsen'
import { motion } from 'motion/react'

export default function NgabsenDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const { user, loading: authLoading } = useAuth()
    const { fetchNgabsenById, getFullLinks, isPro } = useNgabsen()

    const [ngabsen, setNgabsen] = useState<Ngabsen | null>(null)
    const [loading, setLoading] = useState(true)
    const [copiedLink, setCopiedLink] = useState<string | null>(null)

    // Load ngabsen data
    const loadData = useCallback(async () => {
        if (!id) return
        setLoading(true)
        const data = await fetchNgabsenById(id)
        setNgabsen(data)
        setLoading(false)
    }, [id, fetchNgabsenById])

    useEffect(() => {
        if (user && isPro) {
            loadData()
        }
    }, [user, isPro, loadData])

    // Copy to clipboard
    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedLink(type)
            setTimeout(() => setCopiedLink(null), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Format datetime
    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    if (!isPro) {
        router.push('/dashboard/upgrade')
        return null
    }

    if (!ngabsen) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-lg mx-auto text-center py-12">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Acara Tidak Ditemukan</h1>
                    <p className="text-gray-600 mb-6">
                        Acara yang Anda cari tidak tersedia atau sudah dihapus.
                    </p>
                    <Link
                        href="/dashboard/ngabsen"
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-purple-500 text-white font-semibold"
                    >
                        Kembali ke Daftar Acara
                    </Link>
                </div>
            </div>
        )
    }

    const links = getFullLinks(ngabsen)
    const peserta = ngabsen.pendaftaran_ngabsen || []

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
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
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{ngabsen.nama_acara}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {ngabsen.tempat_acara}
                            </span>
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(ngabsen.tanggal_acara)}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={loadData}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Links Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-5 border border-gray-200 mb-6"
                >
                    <h2 className="font-semibold text-gray-900 mb-4">Link untuk Dibagikan</h2>
                    <div className="space-y-3">
                        {/* Registration Link */}
                        {links.pendaftaran && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-28">Form Daftar:</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={links.pendaftaran}
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(links.pendaftaran!, 'pendaftaran')}
                                        className={`px-3 py-2 rounded-lg transition-colors ${copiedLink === 'pendaftaran'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {copiedLink === 'pendaftaran' ? 'Tersalin!' : 'Salin'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Attendee List Link */}
                        {links.daftarPeserta && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-28">Daftar Hadir:</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={links.daftarPeserta}
                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(links.daftarPeserta!, 'peserta')}
                                        className={`px-3 py-2 rounded-lg transition-colors ${copiedLink === 'peserta'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {copiedLink === 'peserta' ? 'Tersalin!' : 'Salin'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Attendee List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200"
                >
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">Daftar Peserta</h2>
                            <p className="text-sm text-gray-500">{peserta.length} peserta terdaftar</p>
                        </div>
                        {peserta.length > 0 && links.daftarPeserta && (
                            <a
                                href={`/api/ngabsen/public/export/${ngabsen.link_ngabsen?.link_daftar_peserta}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Excel
                            </a>
                        )}
                    </div>

                    {peserta.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p>Belum ada peserta yang mendaftar</p>
                            <p className="text-sm mt-1">Bagikan link pendaftaran untuk mengundang peserta</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu Daftar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {peserta.map((p, index) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.nama_peserta}</p>
                                                    {p.deskripsi && (
                                                        <p className="text-xs text-gray-500 truncate max-w-xs">{p.deskripsi}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{p.no_whatsapp}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(p.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
