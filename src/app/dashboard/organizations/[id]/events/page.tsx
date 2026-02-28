'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useEvents } from '@/hooks/useEvents'
import type { CircleEvent, CircleEventInsert, EventRegistration } from '@/types'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function EventManagementPage() {
    const params = useParams()
    const router = useRouter()
    const orgId = params.id as string
    const { user, loading: authLoading } = useAuth()
    const { fetchOrganization, checkMembership } = useOrganizations()
    const {
        loading,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        fetchRegistrations,
        fetchRegistrationCount,
        updateRegistrationStatus,
    } = useEvents()

    const [orgName, setOrgName] = useState('')
    const [events, setEvents] = useState<CircleEvent[]>([])
    const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({})
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
    const [isAdmin, setIsAdmin] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)

    // Create/Edit modal
    const [showEventModal, setShowEventModal] = useState(false)
    const [editingEvent, setEditingEvent] = useState<CircleEvent | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Workshop',
        event_date: '',
        event_time: '',
        type: 'online' as 'online' | 'offline',
        max_participants: 100,
        location: '',
        google_map_url: '',
        zoom_link: '',
        image_url: '',
    })

    // Participants modal
    const [showParticipantsModal, setShowParticipantsModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<CircleEvent | null>(null)
    const [registrations, setRegistrations] = useState<EventRegistration[]>([])
    const [regLoading, setRegLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [user, orgId])

    const loadData = async () => {
        if (!user || !orgId) return
        setPageLoading(true)

        const [orgData, membership] = await Promise.all([
            fetchOrganization(orgId),
            checkMembership(orgId),
        ])

        if (!orgData || !membership.isAdmin) {
            router.push('/dashboard/organizations')
            return
        }

        setOrgName(orgData.name)
        setIsAdmin(true)

        await loadEvents()
        setPageLoading(false)
    }

    const loadEvents = async () => {
        const eventsData = await fetchEvents(orgId)
        setEvents(eventsData)

        // Fetch registration counts
        const counts: Record<string, number> = {}
        await Promise.all(
            eventsData.map(async (e) => {
                counts[e.id] = await fetchRegistrationCount(e.id)
            })
        )
        setRegistrationCounts(counts)
    }

    const openCreateModal = () => {
        setEditingEvent(null)
        setFormData({
            title: '',
            description: '',
            category: 'Workshop',
            event_date: '',
            event_time: '',
            type: 'online',
            max_participants: 100,
            location: '',
            google_map_url: '',
            zoom_link: '',
            image_url: '',
        })
        setShowEventModal(true)
    }

    const openEditModal = (event: CircleEvent) => {
        setEditingEvent(event)
        setFormData({
            title: event.title,
            description: event.description || '',
            category: event.category,
            event_date: event.event_date,
            event_time: event.event_time,
            type: event.type,
            max_participants: event.max_participants,
            location: event.location || '',
            google_map_url: event.google_map_url || '',
            zoom_link: event.zoom_link || '',
            image_url: event.image_url || '',
        })
        setShowEventModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        if (editingEvent) {
            const success = await updateEvent(editingEvent.id, {
                ...formData,
                description: formData.description || null,
                location: formData.location || null,
                google_map_url: formData.google_map_url || null,
                zoom_link: formData.zoom_link || null,
                image_url: formData.image_url || null,
            })
            if (success) {
                setShowEventModal(false)
                await loadEvents()
            }
        } else {
            const eventData: CircleEventInsert = {
                ...formData,
                organization_id: orgId,
                created_by: user.id,
                description: formData.description || null,
                location: formData.location || null,
                google_map_url: formData.google_map_url || null,
                zoom_link: formData.zoom_link || null,
                image_url: formData.image_url || null,
                status: 'upcoming',
            }
            const result = await createEvent(eventData)
            if (result) {
                setShowEventModal(false)
                await loadEvents()
            }
        }
    }

    const handleDelete = async (eventId: string, title: string) => {
        if (!confirm(`Yakin ingin menghapus event "${title}"?`)) return
        const success = await deleteEvent(eventId)
        if (success) await loadEvents()
    }

    const openParticipants = async (event: CircleEvent) => {
        setSelectedEvent(event)
        setRegLoading(true)
        setShowParticipantsModal(true)
        const regs = await fetchRegistrations(event.id)
        setRegistrations(regs)
        setRegLoading(false)
    }

    const handleStatusChange = async (regId: string, status: string) => {
        const success = await updateRegistrationStatus(regId, status)
        if (success && selectedEvent) {
            const regs = await fetchRegistrations(selectedEvent.id)
            setRegistrations(regs)
            // Update counts
            const count = await fetchRegistrationCount(selectedEvent.id)
            setRegistrationCounts(prev => ({ ...prev, [selectedEvent.id]: count }))
        }
    }

    const filteredEvents = events.filter(e =>
        activeTab === 'upcoming' ? e.status === 'upcoming' : e.status === 'past'
    )

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <Link href={`/dashboard/organizations/${orgId}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        ← Kembali ke {orgName}
                    </Link>
                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
                            <p className="text-gray-500 text-sm mt-1">Kelola event untuk {orgName}</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-5xl mx-auto px-4 py-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1.5 mb-6">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Event Mendatang ({events.filter(e => e.status === 'upcoming').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'past' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Event Selesai ({events.filter(e => e.status === 'past').length})
                    </button>
                </div>

                {/* Event List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.5} />
                                <line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.5} />
                                <line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.5} />
                                <line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.5} />
                            </svg>
                            <p className="text-gray-500 mb-4">Belum ada event {activeTab === 'upcoming' ? 'mendatang' : 'selesai'}</p>
                            {activeTab === 'upcoming' && (
                                <button
                                    onClick={openCreateModal}
                                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Buat Event Pertama
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredEvents.map((event) => {
                            const regCount = registrationCounts[event.id] || 0
                            const progress = (regCount / event.max_participants) * 100

                            return (
                                <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Image */}
                                        {event.image_url && (
                                            <img
                                                src={event.image_url}
                                                alt={event.title}
                                                className="w-full sm:w-36 h-28 object-cover rounded-xl flex-shrink-0"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                                                    {event.description && (
                                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                                                    )}
                                                </div>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full flex-shrink-0 font-medium">
                                                    {event.category}
                                                </span>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                                                <span className="flex items-center gap-1.5">
                                                    📅 {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    🕐 {event.event_time?.substring(0, 5)} WIB
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${event.type === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {event.type === 'online' ? '🎥 Online' : '📍 ' + (event.location || 'Offline')}
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-600">Pendaftar</span>
                                                    <span className="font-semibold text-gray-900">{regCount}/{event.max_participants}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${progress >= 90 ? 'bg-red-500' : progress >= 70 ? 'bg-yellow-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 mt-4">
                                                {event.type === 'online' && event.zoom_link && (
                                                    <a href={event.zoom_link} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Buka Zoom">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                )}
                                                {event.type === 'offline' && event.google_map_url && (
                                                    <a href={event.google_map_url} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Google Maps">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => openParticipants(event)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Peserta">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(event)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(event.id, event.title)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Create/Edit Event Modal */}
            {showEventModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingEvent ? 'Edit Event' : 'Buat Event Baru'}
                                </h2>
                                <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Judul Event *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Contoh: Workshop Digital Marketing 2026"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Deskripsi</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Jelaskan tentang event Anda..."
                                />
                            </div>

                            {/* Category + Max Participants */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Kategori *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Workshop">Workshop</option>
                                        <option value="Seminar">Seminar</option>
                                        <option value="Pelatihan">Pelatihan</option>
                                        <option value="Talkshow">Talkshow</option>
                                        <option value="Webinar">Webinar</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Max Peserta *</label>
                                    <input
                                        type="number"
                                        value={formData.max_participants}
                                        onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 100 }))}
                                        min="1"
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Date + Time */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Tanggal *</label>
                                    <input
                                        type="date"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Waktu *</label>
                                    <input
                                        type="time"
                                        value={formData.event_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Event Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Tipe Event *</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: 'online' }))}
                                        className={`p-4 border-2 rounded-xl transition-all ${formData.type === 'online' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-2xl block mb-1">🎥</span>
                                        <p className={`font-semibold ${formData.type === 'online' ? 'text-blue-600' : 'text-gray-600'}`}>Online</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type: 'offline' }))}
                                        className={`p-4 border-2 rounded-xl transition-all ${formData.type === 'offline' ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="text-2xl block mb-1">📍</span>
                                        <p className={`font-semibold ${formData.type === 'offline' ? 'text-green-600' : 'text-gray-600'}`}>Offline</p>
                                    </button>
                                </div>
                            </div>

                            {/* Conditional fields */}
                            {formData.type === 'online' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Link Zoom</label>
                                    <input
                                        type="url"
                                        value={formData.zoom_link}
                                        onChange={(e) => setFormData(prev => ({ ...prev, zoom_link: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="https://zoom.us/j/123456789"
                                    />
                                </div>
                            )}

                            {formData.type === 'offline' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">Lokasi *</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Contoh: Gedung Serbaguna, Jakarta Pusat"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">Google Maps URL</label>
                                        <input
                                            type="url"
                                            value={formData.google_map_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, google_map_url: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://maps.google.com/?q=..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">URL Gambar Event</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {formData.image_url && (
                                    <img src={formData.image_url} alt="Preview" className="mt-3 w-full max-h-48 object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEventModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Menyimpan...' : editingEvent ? 'Simpan Perubahan' : 'Buat Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Participants Modal */}
            {showParticipantsModal && selectedEvent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Peserta Event</h2>
                                    <p className="text-sm text-gray-500 mt-1">{selectedEvent.title}</p>
                                </div>
                                <button onClick={() => setShowParticipantsModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {regLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : registrations.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p className="text-gray-500">Belum ada peserta terdaftar</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-green-50 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-green-600">{registrations.filter(r => r.status === 'confirmed').length}</p>
                                            <p className="text-xs text-green-700">Confirmed</p>
                                        </div>
                                        <div className="bg-yellow-50 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-yellow-600">{registrations.filter(r => r.status === 'pending').length}</p>
                                            <p className="text-xs text-yellow-700">Pending</p>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-red-600">{registrations.filter(r => r.status === 'cancelled').length}</p>
                                            <p className="text-xs text-red-700">Cancelled</p>
                                        </div>
                                    </div>

                                    {/* List */}
                                    {registrations.map((reg) => (
                                        <div key={reg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-900">{reg.name}</p>
                                                <p className="text-sm text-gray-500">{reg.email}</p>
                                                {reg.phone && <p className="text-sm text-gray-400">{reg.phone}</p>}
                                                {reg.institution && <p className="text-sm text-gray-400">{reg.institution}</p>}
                                            </div>
                                            <select
                                                value={reg.status}
                                                onChange={(e) => handleStatusChange(reg.id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 ${reg.status === 'confirmed' ? 'bg-green-100 text-green-700'
                                                        : reg.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                <option value="confirmed">Confirmed</option>
                                                <option value="pending">Pending</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <BottomNavigation variant="organizations" />
        </div>
    )
}
