'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useEvents } from '@/hooks/useEvents'
import type { CircleEvent } from '@/types'

interface MemberEventsSectionProps {
    organizationId: string
    organizationName: string
}

export default function MemberEventsSection({ organizationId, organizationName }: MemberEventsSectionProps) {
    const router = useRouter()
    const { user } = useAuth()
    const { fetchEvents, fetchRegistrationCount } = useEvents()

    const [events, setEvents] = useState<CircleEvent[]>([])
    const [eventCounts, setEventCounts] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Registration Modal State
    const [showRegModal, setShowRegModal] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [regForm, setRegForm] = useState({ phone: '', institution: '', job_title: '', city: '' })
    const [paymentFile, setPaymentFile] = useState<File | null>(null)
    const [regSubmitting, setRegSubmitting] = useState(false)
    const [regSuccess, setRegSuccess] = useState(false)

    useEffect(() => {
        loadEvents()
    }, [organizationId])

    const loadEvents = async () => {
        setLoading(true)
        setError(null)
        try {
            const evts = await fetchEvents(organizationId, 'upcoming')
            setEvents(evts.slice(0, 3)) // Show top 3 upcoming events

            const counts: Record<string, number> = {}
            for (const ev of evts.slice(0, 3)) {
                counts[ev.id] = await fetchRegistrationCount(ev.id)
            }
            setEventCounts(counts)
        } catch (err: any) {
            console.error('Failed to load events:', err)
            setError('Gagal memuat daftar event')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (eventId: string) => {
        if (!user) return
        setRegSubmitting(true)
        try {
            let paymentProofUrl: string | null = null
            if (paymentFile) {
                const cloudFormData = new FormData()
                cloudFormData.append('file', paymentFile)
                cloudFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'officialiddata')
                cloudFormData.append('folder', 'official-id/events/payment_proofs')
                const cloudRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    { method: 'POST', body: cloudFormData }
                )
                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json()
                    paymentProofUrl = cloudData.secure_url
                }
            }

            const res = await fetch('/api/events/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: eventId,
                    name: user.full_name || '',
                    email: user.email || '',
                    phone: regForm.phone || null,
                    institution: regForm.institution || null,
                    job_title: regForm.job_title || null,
                    city: regForm.city || null,
                    payment_proof_url: paymentProofUrl,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal mendaftar')

            setRegSuccess(true)
            const newCount = await fetchRegistrationCount(eventId)
            setEventCounts(prev => ({ ...prev, [eventId]: newCount }))
        } catch (err: any) {
            alert(err.message || 'Gagal mendaftar event')
        } finally {
            setRegSubmitting(false)
        }
    }

    const openRegModal = (eventId: string) => {
        if (!user) {
            router.push(`/login?redirect=/dashboard/organizations/${organizationId}`)
            return
        }
        setSelectedEventId(eventId)
        setRegForm({
            phone: user.phone || '',
            institution: user.company || '',
            job_title: '',
            city: ''
        })
        setRegSuccess(false)
        setPaymentFile(null)
        setShowRegModal(true)
    }

    const closeRegModal = () => {
        setShowRegModal(false)
        setSelectedEventId(null)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (events.length === 0) return null

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Event Mendatang
            </h2>

            {error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : (
                <div className="space-y-4">
                    {events.map((event) => {
                        const eCount = eventCounts[event.id] || 0
                        const isFull = eCount >= event.max_participants

                        return (
                            <div key={event.id} className="block group border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-100 transition-colors">
                                {event.image_url && (
                                    <div className="h-24 w-full relative bg-gray-100">
                                        <Image
                                            src={event.image_url}
                                            alt={event.title}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <p className="text-xs font-semibold text-indigo-600 mb-1">{event.category}</p>
                                    <h3 className="font-bold text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">{event.title}</h3>

                                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                                        <p>📅 {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p>📍 {event.type === 'online' ? 'Online' : 'Offline'}</p>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                                            {eCount}/{event.max_participants} Peserta
                                        </div>
                                        <button
                                            onClick={() => openRegModal(event.id)}
                                            disabled={isFull}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isFull
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                }`}
                                        >
                                            {isFull ? 'Penuh' : 'Daftar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Registration Modal */}
            {showRegModal && selectedEventId && user && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-6">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl relative">
                        {/* Sticky Header */}
                        <div className="flex-none bg-white border-b border-gray-100 rounded-t-2xl px-6 py-4 flex items-center justify-between z-10">
                            <h3 className="font-bold text-lg text-gray-900">Daftar Event</h3>
                            <button onClick={closeRegModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {regSuccess ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h4>
                                    <p className="text-gray-600 mb-6 text-sm">Status pendaftaran Anda sedang diproses. Silakan cek menu Tiket Event berkala.</p>
                                </div>
                            ) : (
                                <form id="event-reg-form" onSubmit={(e) => { e.preventDefault(); handleRegister(selectedEventId) }} className="space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                                        <p className="text-xs text-gray-500 mb-1">Mendaftar sebagai:</p>
                                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                                        <p className="text-sm text-gray-600">{user.email}</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">No WhatsApp <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={regForm.phone}
                                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Institusi/Perusahaan</label>
                                        <input
                                            type="text"
                                            value={regForm.institution}
                                            onChange={(e) => setRegForm({ ...regForm, institution: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={regForm.job_title}
                                                onChange={(e) => setRegForm({ ...regForm, job_title: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kota <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={regForm.city}
                                                onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Transfer (Jika Berbayar)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                                        />
                                    </div>

                                </form>
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="flex-none bg-white border-t border-gray-100 rounded-b-2xl p-6">
                            {regSuccess ? (
                                <button
                                    onClick={closeRegModal}
                                    className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Tutup
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        type="button"
                                        onClick={closeRegModal}
                                        className="w-full sm:flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors order-2 sm:order-1"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        form="event-reg-form"
                                        type="submit"
                                        disabled={regSubmitting}
                                        className="w-full sm:flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors order-1 sm:order-2"
                                    >
                                        {regSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}
