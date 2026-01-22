'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePublicNgabsen } from '@/hooks/useNgabsen'
import { motion } from 'motion/react'

interface EventInfo {
    acara: {
        id: string
        nama_acara: string
        deskripsi_acara: string | null
    }
    peserta: any[]
    total: number
}

export default function PublicNgabsenPage() {
    const params = useParams()
    const router = useRouter()
    const linkId = params.linkId as string

    const { submitPendaftaran, loading, error, clearError } = usePublicNgabsen()

    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
    const [loadingEvent, setLoadingEvent] = useState(true)
    const [formData, setFormData] = useState({
        nama_peserta: '',
        deskripsi: '',
        email: '',
        no_whatsapp: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [success, setSuccess] = useState(false)

    // Load event info
    useEffect(() => {
        const loadEvent = async () => {
            try {
                const response = await fetch(`/api/ngabsen/public/peserta/${linkId}`)
                const result = await response.json()

                if (result.success) {
                    setEventInfo(result.data)
                }
            } catch (err) {
                console.error('Failed to load event:', err)
            } finally {
                setLoadingEvent(false)
            }
        }

        if (linkId) {
            loadEvent()
        }
    }, [linkId])

    // Get link_pendaftaran from linkId (they share the same event)
    // We need to fetch this differently since we have link_daftar_peserta
    // For now, we assume linkId IS link_pendaftaran

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.nama_peserta.trim()) {
            newErrors.nama_peserta = 'Nama wajib diisi'
        } else if (formData.nama_peserta.length < 2) {
            newErrors.nama_peserta = 'Nama minimal 2 karakter'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email wajib diisi'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid'
        }

        if (!formData.no_whatsapp.trim()) {
            newErrors.no_whatsapp = 'Nomor WhatsApp wajib diisi'
        } else if (!/^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(formData.no_whatsapp.replace(/\s/g, ''))) {
            newErrors.no_whatsapp = 'Format nomor tidak valid (contoh: 08123456789)'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        clearError()

        if (!validateForm()) return

        const result = await submitPendaftaran({
            link_pendaftaran: linkId,
            nama_peserta: formData.nama_peserta,
            deskripsi: formData.deskripsi || null,
            email: formData.email,
            no_whatsapp: formData.no_whatsapp.replace(/\s/g, '')
        })

        if (result) {
            setSuccess(true)
            // Redirect to attendee list after 2 seconds
            if (result.redirect) {
                setTimeout(() => {
                    router.push(`/ngabsen/peserta/${result.redirect}`)
                }, 2000)
            }
        }
    }



    if (loadingEvent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    // Note: We're reusing the peserta endpoint to check if link is valid
    // In production, you'd want a separate endpoint to get event info by registration link

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Berhasil Mendaftar!</h1>
                    <p className="text-gray-600 mb-4">
                        Terima kasih, {formData.nama_peserta}. Anda telah terdaftar.
                    </p>
                    <div className="animate-pulse text-sm text-gray-500">
                        Mengalihkan ke daftar peserta...
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div className="max-w-lg mx-auto py-8">
                {/* Event Info Card */}
                {eventInfo?.acara && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 mb-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{eventInfo.acara.nama_acara}</h1>
                                <p className="text-sm text-gray-500">Daftar Hadir</p>
                            </div>
                        </div>
                        {eventInfo.acara.deskripsi_acara && (
                            <p className="text-sm text-gray-600">{eventInfo.acara.deskripsi_acara}</p>
                        )}
                    </motion.div>
                )}

                {/* Registration Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Isi Data Anda</h2>

                    {/* Global Error */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Nama */}
                        <div>
                            <label htmlFor="nama_peserta" className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="nama_peserta"
                                name="nama_peserta"
                                value={formData.nama_peserta}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.nama_peserta ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                            />
                            {errors.nama_peserta && (
                                <p className="text-red-500 text-xs mt-1">{errors.nama_peserta}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contoh@email.com"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <label htmlFor="no_whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor WhatsApp <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                id="no_whatsapp"
                                name="no_whatsapp"
                                value={formData.no_whatsapp}
                                onChange={handleChange}
                                placeholder="08123456789"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${errors.no_whatsapp ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                            />
                            {errors.no_whatsapp && (
                                <p className="text-red-500 text-xs mt-1">{errors.no_whatsapp}</p>
                            )}
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan <span className="text-gray-400">(opsional)</span>
                            </label>
                            <textarea
                                id="deskripsi"
                                name="deskripsi"
                                value={formData.deskripsi}
                                onChange={handleChange}
                                placeholder="Tambahkan keterangan jika perlu"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 px-4 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Mendaftar...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Ngabsen
                            </>
                        )}
                    </button>
                </motion.form>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    Powered by Official.id
                </p>
            </div>
        </div>
    )
}
