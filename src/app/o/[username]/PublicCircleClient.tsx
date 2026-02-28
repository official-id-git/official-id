'use client'

import { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useEvents } from '@/hooks/useEvents'
import SendMessageModal from '@/components/messages/SendMessageModal'
import type { Organization, OrganizationMember, CircleEvent } from '@/types'

interface PublicCircleClientProps {
    circleUsername: string
}

import { useSecurity } from '@/hooks/useSecurity'

export default function PublicCircleClient({ circleUsername }: PublicCircleClientProps) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
            <CircleContent circleUsername={circleUsername} />
        </Suspense>
    )
}

function CircleContent({ circleUsername }: PublicCircleClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // RSVP State
    const [rsvpTicket, setRsvpTicket] = useState<string | null>(null)
    const [rsvpStatus, setRsvpStatus] = useState<string>('')
    const [rsvpSubmitting, setRsvpSubmitting] = useState(false)
    const [rsvpSuccess, setRsvpSuccess] = useState(false)

    const { user } = useAuth()
    const { fetchOrganization, fetchMembers, joinOrganization, checkMembership, loading } = useOrganizations()
    const { fetchEvents, fetchRegistrationCount, registerForEvent } = useEvents()
    const { validateInput } = useSecurity()

    const [org, setOrg] = useState<Organization | null>(null)
    const [members, setMembers] = useState<OrganizationMember[]>([])
    const [pageLoading, setPageLoading] = useState(true)
    const [membershipStatus, setMembershipStatus] = useState<string | null>(null)
    const [isOwner, setIsOwner] = useState(false)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Request to Join state
    const [requestEmail, setRequestEmail] = useState('')
    const [requestMessage, setRequestMessage] = useState('')
    const [requesting, setRequesting] = useState(false)
    const [requestSuccess, setRequestSuccess] = useState(false)

    // Search and Sort state
    const [searchQuery, setSearchQuery] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Message modal state
    const [messageModalOpen, setMessageModalOpen] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string } | null>(null)

    // Events state
    const [circleEvents, setCircleEvents] = useState<CircleEvent[]>([])
    const [eventCounts, setEventCounts] = useState<Record<string, number>>({})
    const [showRegModal, setShowRegModal] = useState(false)
    const [regEventId, setRegEventId] = useState<string | null>(null)
    const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', institution: '', payment_proof: '' })
    const [paymentFile, setPaymentFile] = useState<File | null>(null)
    const [regSubmitting, setRegSubmitting] = useState(false)
    const [regSuccess, setRegSuccess] = useState(false)

    // Filtered and sorted members
    const filteredMembers = useMemo(() => {
        let result = [...members]

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            result = result.filter((member: any) => {
                const userName = member.users?.full_name?.toLowerCase() || ''

                // Get business card data
                const businessCards = member.users?.business_cards || []
                const companyMatch = businessCards.some((card: any) =>
                    card.company?.toLowerCase().includes(query) ||
                    card.city?.toLowerCase().includes(query) ||
                    (card.business_description && card.business_description.toLowerCase().includes(query))
                )

                return userName.includes(query) || companyMatch
            })
        }

        // Sort by name
        result.sort((a: any, b: any) => {
            const nameA = a.users?.full_name?.toLowerCase() || ''
            const nameB = b.users?.full_name?.toLowerCase() || ''
            if (sortOrder === 'asc') {
                return nameA.localeCompare(nameB)
            } else {
                return nameB.localeCompare(nameA)
            }
        })

        return result
    }, [members, searchQuery, sortOrder])

    const handleOpenMessageModal = (recipientId: string, recipientName: string) => {
        setSelectedRecipient({ id: recipientId, name: recipientName })
        setMessageModalOpen(true)
    }

    useEffect(() => {
        loadCircleData()
    }, [circleUsername, user])

    useEffect(() => {
        const ticket = searchParams.get('rsvp')
        if (ticket) {
            setRsvpTicket(ticket)
        }
    }, [searchParams])

    const handleRSVPSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!rsvpTicket || !rsvpStatus) return

        setRsvpSubmitting(true)
        try {
            const res = await fetch('/api/events/rsvp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_number: rsvpTicket, status: rsvpStatus }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal menyimpan RSVP')

            setRsvpSuccess(true)
        } catch (err: any) {
            alert(err.message)
        } finally {
            setRsvpSubmitting(false)
        }
    }

    const loadCircleData = async () => {
        setPageLoading(true)
        setError(null)

        try {
            // Fetch organization
            const orgData = await fetchOrganization(circleUsername)

            if (!orgData) {
                setError('Circle tidak ditemukan')
                return
            }

            setOrg(orgData)

            // If private, only fetch members if user is logged in
            // Verification will happen server-side or we just hide the members below if they aren't authorized
            if (orgData.is_public || user) {
                const membersData = await fetchMembers(orgData.id)
                const approvedMembers = membersData.filter(m => m.status === 'APPROVED')
                setMembers(approvedMembers)
            }

            // Fetch events for this circle
            if (orgData) {
                const evts = await fetchEvents(orgData.id, 'upcoming')
                setCircleEvents(evts)
                const counts: Record<string, number> = {}
                await Promise.all(evts.map(async (ev) => {
                    counts[ev.id] = await fetchRegistrationCount(ev.id)
                }))
                setEventCounts(counts)
            }

            // Check user membership if logged in
            if (user) {
                const membership = await checkMembership(orgData.id)
                setMembershipStatus(membership.status)
                setIsOwner(membership.isOwner)
            }
        } catch (err: any) {
            console.error('Error loading circle:', err)
            setError('Terjadi kesalahan saat memuat data Circle')
        } finally {
            setPageLoading(false)
        }
    }

    const handleJoin = async () => {
        if (!user) {
            router.push(`/login?redirect=/o/${circleUsername}`)
            return
        }

        if (!org) return

        setJoining(true)
        setError(null)

        try {
            const success = await joinOrganization(org.id)
            if (success) {
                // Refresh membership status
                const membership = await checkMembership(org.id)
                setMembershipStatus(membership.status)

                if (membership.status === 'APPROVED') {
                    alert('Berhasil bergabung dengan Circle!')
                } else {
                    alert('Permintaan bergabung telah dikirim. Menunggu persetujuan admin.')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Gagal bergabung dengan Circle')
        } finally {
            setJoining(false)
        }
    }

    const handleRequestJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!org || !requestEmail) return

        setRequesting(true)
        setError(null)

        try {
            const res = await fetch('/api/organizations/request-join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: org.id,
                    email: requestEmail,
                    message: requestMessage
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal mengirim permintaan')

            setRequestSuccess(true)
            setRequestEmail('')
            setRequestMessage('')
        } catch (err: any) {
            alert(err.message)
        } finally {
            setRequesting(false)
        }
    }

    if (pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error || !org) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Circle Tidak Ditemukan</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        )
    }

    const isMember = membershipStatus === 'APPROVED' || isOwner
    const isPending = membershipStatus === 'PENDING'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Kembali</span>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {/* Circle Info Card */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>
                    <div className="relative px-6 pb-6">
                        {/* Logo */}
                        <div className="absolute -top-16 left-6">
                            {org.logo_url ? (
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                                    <Image src={org.logo_url} unoptimized alt={org.name} width={128} height={128} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                                    <span className="text-4xl font-bold text-white">{org.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-20">
                            {/* Title and Badge */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{org.name}</h1>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${org.is_public ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {org.is_public ? 'Publik' : 'Privat'}
                                        </span>
                                        {org.category && (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                                                {org.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {org.description && (
                                <p className="text-gray-600 text-lg leading-relaxed mb-6">{org.description}</p>
                            )}

                            {/* Stats - Only show if public or member */}
                            {(org.is_public || isMember) && (
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="font-semibold">{members.length}</span>
                                        <span>Anggota</span>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4">
                                {isOwner ? (
                                    <Link
                                        href={`/dashboard/organizations/${org.id}`}
                                        className="w-full py-3 bg-blue-600 text-white text-center rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Kelola Circle
                                    </Link>
                                ) : isMember ? (
                                    <Link
                                        href={`/dashboard/organizations/${org.id}`}
                                        className="w-full py-3 bg-green-600 text-white text-center rounded-xl font-medium hover:bg-green-700 transition-colors"
                                    >
                                        ✓ Sudah Bergabung - Lihat Detail
                                    </Link>
                                ) : isPending ? (
                                    <button
                                        disabled
                                        className="w-full py-3 bg-yellow-100 text-yellow-700 text-center rounded-xl font-medium cursor-not-allowed"
                                    >
                                        Menunggu Persetujuan
                                    </button>
                                ) : org.is_public ? (
                                    /* PUBLIC CIRCLES: Standard join flow */
                                    <button
                                        onClick={handleJoin}
                                        disabled={joining}
                                        className="w-full py-3 bg-blue-600 text-white text-center rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {joining ? 'Memproses...' : 'Bergabung dengan Circle'}
                                    </button>
                                ) : (
                                    /* PRIVATE CIRCLES: Request Form */
                                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Tertarik bergabung?</h3>
                                        <p className="text-blue-700 mb-4 text-sm">Circle ini bersifat privat. Sampaikan email aktif Anda untuk meminta undangan dari Admin.</p>

                                        {requestSuccess ? (
                                            <div className="bg-green-100 text-green-700 p-4 rounded-xl flex items-center gap-3">
                                                <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <p className="text-sm font-medium">Permintaan berhasil dikirim! Silakan periksa email Anda nanti untuk update status.</p>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleRequestJoin} className="space-y-3">
                                                <input
                                                    type="email"
                                                    required
                                                    value={requestEmail}
                                                    onChange={e => setRequestEmail(e.target.value)}
                                                    placeholder="Alamat Email Anda"
                                                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    disabled={requesting}
                                                />
                                                <textarea
                                                    value={requestMessage}
                                                    onChange={e => setRequestMessage(e.target.value)}
                                                    placeholder="Pesan ke Admin (Opsional: sebutkan alasan ingin bergabung)"
                                                    rows={2}
                                                    className="w-full px-4 py-3 rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                                    disabled={requesting}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={requesting || !requestEmail}
                                                    className="w-full py-3 bg-blue-600 text-white text-center rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                                                >
                                                    {requesting ? (
                                                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                                    ) : 'Kirim Permintaan Bergabung'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Events Section */}
                {circleEvents.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                Event Mendatang
                            </h2>
                            <p className="text-white/80 text-sm mt-1">Jelajahi event menarik dari {org.name}</p>
                        </div>

                        <div className="p-6">
                            {/* RSVP Section */}
                            {rsvpTicket && (
                                <div className="mb-8 bg-amber-50 rounded-2xl p-6 border-2 border-amber-200">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-amber-100 p-3 rounded-xl flex-shrink-0">
                                            <span className="text-2xl">🎟️</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-amber-900 mb-2">Konfirmasi Kehadiran (RSVP)</h3>
                                            <p className="text-amber-800 mb-4 text-sm">
                                                Anda sedang dimintai konfirmasi kehadiran untuk tiket <strong>{rsvpTicket}</strong>.
                                                Mohon pilih status kehadiran Anda di bawah ini:
                                            </p>

                                            {rsvpSuccess ? (
                                                <div className="bg-green-100 text-green-800 p-4 rounded-xl flex items-center gap-3 border border-green-200">
                                                    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <p className="font-semibold text-sm">Terima kasih! Konfirmasi kehadiran Anda berhasil disimpan.</p>
                                                </div>
                                            ) : (
                                                <form onSubmit={handleRSVPSubmit} className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                                                    <div className="space-y-3 mb-5">
                                                        <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input type="radio" name="rsvpStatus" value="Hadir Tepat Waktu" onChange={(e) => setRsvpStatus(e.target.value)} className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                                            <span className="ml-3 font-medium text-gray-900">✅ Hadir Tepat Waktu</span>
                                                        </label>
                                                        <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input type="radio" name="rsvpStatus" value="Hadir Terlambat" onChange={(e) => setRsvpStatus(e.target.value)} className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                                            <span className="ml-3 font-medium text-gray-900">⏳ Hadir (Terlambat)</span>
                                                        </label>
                                                        <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                                                            <input type="radio" name="rsvpStatus" value="Tidak Hadir" onChange={(e) => setRsvpStatus(e.target.value)} className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300" required />
                                                            <span className="ml-3 font-medium text-gray-900">❌ Tidak Dapat Hadir</span>
                                                        </label>
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        disabled={rsvpSubmitting || !rsvpStatus}
                                                        className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {rsvpSubmitting ? 'Menyimpan...' : 'Kirim Konfirmasi'}
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Featured Event (first) */}
                            {circleEvents.length > 0 && (() => {
                                const featured = circleEvents[0]
                                const fCount = eventCounts[featured.id] || 0
                                const fProgress = (fCount / featured.max_participants) * 100
                                return (
                                    <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
                                        <div className="flex flex-col sm:flex-row gap-5">
                                            {featured.image_url && (
                                                <img src={featured.image_url} alt={featured.title} className="w-full sm:w-48 h-36 object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                            )}
                                            <div className="flex-1">
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium mb-2">{featured.category}</span>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{featured.title}</h3>
                                                {featured.description && <p className="text-gray-600 text-sm line-clamp-2 mb-3">{featured.description}</p>}
                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                                                    <span>📅 {new Date(featured.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    <span>🕐 {featured.event_time?.substring(0, 5)} WIB</span>
                                                    <span>{featured.type === 'online' ? '🎥 Online' : '📍 ' + (featured.location || 'Offline')}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between text-sm mb-1">
                                                            <span className="text-gray-500">🎟️ Pendaftar</span>
                                                            <span className="font-semibold">{fCount}/{featured.max_participants}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(fProgress, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (!user) {
                                                                router.push(`/login?redirect=/o/${circleUsername}`)
                                                                return
                                                            }
                                                            setRegEventId(featured.id)
                                                            setRegForm({
                                                                name: user.full_name || '',
                                                                email: user.email || '',
                                                                phone: user.phone || '',
                                                                institution: user.company || '',
                                                                payment_proof: '',
                                                            })
                                                            setRegSuccess(false)
                                                            setShowRegModal(true)
                                                        }}
                                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm flex-shrink-0"
                                                    >
                                                        Daftar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* Other events grid */}
                            {circleEvents.length > 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {circleEvents.slice(1).map((event) => {
                                        const eCount = eventCounts[event.id] || 0
                                        const eProgress = (eCount / event.max_participants) * 100
                                        return (
                                            <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                                {event.image_url && (
                                                    <img src={event.image_url} alt={event.title} className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                                )}
                                                <div className="p-4">
                                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium mb-2">{event.category}</span>
                                                    <h4 className="font-bold text-gray-900 mb-1">{event.title}</h4>
                                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                                        <p>📅 {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                        <p>🕐 {event.event_time?.substring(0, 5)} WIB</p>
                                                        <p>{event.type === 'online' ? '🎥 Online' : '📍 ' + (event.location || 'Offline')}</p>
                                                    </div>
                                                    <div className="mb-3">
                                                        <div className="flex items-center justify-between text-xs mb-1">
                                                            <span className="text-gray-500">Pendaftar</span>
                                                            <span className="font-semibold">{eCount}/{event.max_participants}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${Math.min(eProgress, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (!user) {
                                                                router.push(`/login?redirect=/o/${circleUsername}`)
                                                                return
                                                            }
                                                            setRegEventId(event.id)
                                                            setRegForm({
                                                                name: user.full_name || '',
                                                                email: user.email || '',
                                                                phone: user.phone || '',
                                                                institution: user.company || '',
                                                                payment_proof: '',
                                                            })
                                                            setRegSuccess(false)
                                                            setShowRegModal(true)
                                                        }}
                                                        className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
                                                    >
                                                        Daftar Sekarang
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Members List - Only show if public or if user is a member */}
                {(org.is_public || isMember) && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Anggota Circle</h2>

                            {/* Search and Sort Controls */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                {/* Search Input */}
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Cari anggota..."
                                        value={searchQuery}
                                        onChange={async (e) => {
                                            const val = e.target.value
                                            const isValid = await validateInput(val)
                                            if (isValid) setSearchQuery(val)
                                        }}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
                                    />
                                </div>

                                {/* Sort Dropdown */}
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="asc">A - Z</option>
                                    <option value="desc">Z - A</option>
                                </select>
                            </div>
                        </div>

                        {members.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Belum ada anggota yang bergabung</p>
                        ) : filteredMembers.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Tidak ada anggota yang sesuai dengan pencarian "{searchQuery}"</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredMembers.map((member: any) => {
                                    const userData = member.users || {}
                                    const userName = userData.full_name || 'Anonymous'
                                    const userAvatar = userData.avatar_url
                                    const userId = userData.id

                                    // Link directly to business card using user_id
                                    const cardLink = userId ? `/c/${userId}` : null

                                    return (
                                        <div
                                            key={member.id}
                                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                                        >
                                            {/* Header Info */}
                                            <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                                                {userAvatar ? (
                                                    <Image
                                                        src={userAvatar}
                                                        alt={userName}
                                                        width={40}
                                                        height={40}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white font-semibold text-sm">
                                                            {userName.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate text-sm">
                                                        {userName}
                                                    </p>
                                                    {member.is_admin && (
                                                        <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Admin</span>
                                                    )}
                                                </div>
                                                {userId && (
                                                    <button
                                                        onClick={() => handleOpenMessageModal(userId, userName)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Kirim Pesan"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Cards Carousel */}
                                            <div className="relative">
                                                {userData.business_cards && userData.business_cards.length > 0 ? (
                                                    <MemberToCardCarousel
                                                        cards={userData.business_cards}
                                                        userId={userId}
                                                    />
                                                ) : (
                                                    <div className="p-8 text-center text-gray-400 text-sm bg-gray-50">
                                                        Belum ada kartu nama
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Message Modal */}
            {selectedRecipient && (
                <SendMessageModal
                    isOpen={messageModalOpen}
                    onClose={() => {
                        setMessageModalOpen(false)
                        setSelectedRecipient(null)
                    }}
                    recipientId={selectedRecipient.id}
                    recipientName={selectedRecipient.name}
                />
            )}

            {/* Event Registration Modal */}
            {showRegModal && regEventId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Form Pendaftaran</h2>
                                <button onClick={() => setShowRegModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{circleEvents.find(e => e.id === regEventId)?.title}</p>
                        </div>

                        {regSuccess ? (
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h3>
                                <p className="text-gray-600 text-sm">Terima kasih telah mendaftar. Email konfirmasi telah dikirim ke <strong>{regForm.email}</strong>.</p>
                                <button onClick={() => setShowRegModal(false)} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                                    Tutup
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                setRegSubmitting(true)
                                try {
                                    // Step 1: Upload payment proof directly to Cloudinary from client (bypasses API body limit)
                                    let paymentProofUrl: string | null = null
                                    if (paymentFile) {
                                        const cloudFormData = new FormData()
                                        cloudFormData.append('file', paymentFile)
                                        cloudFormData.append('upload_preset', 'official_id')
                                        cloudFormData.append('folder', 'official-id/events/payment_proofs')

                                        const cloudRes = await fetch(
                                            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                                            { method: 'POST', body: cloudFormData }
                                        )
                                        if (cloudRes.ok) {
                                            const cloudData = await cloudRes.json()
                                            paymentProofUrl = cloudData.secure_url
                                        } else {
                                            console.error('Cloudinary upload failed:', await cloudRes.text())
                                        }
                                    }

                                    // Step 2: Send registration data + payment proof URL to our API
                                    const res = await fetch('/api/events/register', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            event_id: regEventId,
                                            name: regForm.name,
                                            email: regForm.email,
                                            phone: regForm.phone || null,
                                            institution: regForm.institution || null,
                                            payment_proof_url: paymentProofUrl,
                                        }),
                                    })
                                    const data = await res.json()
                                    if (!res.ok) throw new Error(data.error || 'Gagal mendaftar')
                                    setRegSuccess(true)
                                    // Update count
                                    const newCount = await fetchRegistrationCount(regEventId!)
                                    setEventCounts(prev => ({ ...prev, [regEventId!]: newCount }))
                                } catch (err: any) {
                                    alert(err.message || 'Gagal mendaftar')
                                } finally {
                                    setRegSubmitting(false)
                                }
                            }} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Nama Lengkap <span className="text-red-600">*</span></label>
                                    <input type="text" required value={regForm.name} onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Email <span className="text-red-600">*</span></label>
                                    <input type="email" required value={regForm.email} onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Nomor Telepon</label>
                                    <input type="tel" value={regForm.phone} onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Institusi/Perusahaan</label>
                                    <input type="text" value={regForm.institution} onChange={(e) => setRegForm(prev => ({ ...prev, institution: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-1">Bukti Pembayaran (Opsional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                setPaymentFile(file)
                                                setRegForm(prev => ({ ...prev, payment_proof: file.name }))
                                            } else {
                                                setPaymentFile(null)
                                                setRegForm(prev => ({ ...prev, payment_proof: '' }))
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG. Sertakan jika event ini mewajibkan biaya registrasi.</p>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={regSubmitting} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                        {regSubmitting ? 'Mendaftar...' : 'Daftar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

import {
    ModernDarkCard,
    CreativeCard,
    MinimalWhiteCard,
    ElegantCard,
    CorporateCard,
    TechCard,
    ArtisticCard,
    LuxuryCard,
    VibrantCard
} from '@/components/cards/templates/CardTemplates'

// Helper component for carousel
function MemberToCardCarousel({ cards, userId }: { cards: any[], userId: string }) {
    // Sort cards: main cards first (if any logic), otherwise by creation
    // For now just taking them as is

    // We only show public cards or whatever logic is needed. Assuming all fetched cards are displayable.

    // If carousel needed
    const [activeIndex, setActiveIndex] = useState(0)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget
        const index = Math.round(container.scrollLeft / container.clientWidth)
        if (index !== activeIndex) {
            setActiveIndex(index)
        }
    }

    // Mapping template ID to component
    const getTemplateComponent = (templateId: string) => {
        const templates: any = {
            'modern_dark': ModernDarkCard,
            'creative': CreativeCard,
            'minimal_white': MinimalWhiteCard,
            'elegant': ElegantCard,
            'corporate': CorporateCard,
            'tech': TechCard,
            'artistic': ArtisticCard,
            'luxury': LuxuryCard,
            'vibrant': VibrantCard,
            'professional': ModernDarkCard, // Fallback or mapping for 'professional'
            'modern': ModernDarkCard // Fallback for 'modern'
        }
        return templates[templateId] || ModernDarkCard
    }

    if (cards.length === 0) return null

    return (
        <div className="relative pb-4 bg-gray-50">
            {/* Scroll Container */}
            <div
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide touch-pan-x"
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {cards.map((card, idx) => {
                    const Template = getTemplateComponent(card.template)
                    // Ensure visible_fields is an object
                    const visibleFields = typeof card.visible_fields === 'object' ? card.visible_fields : {}
                    const socialLinks = typeof card.social_links === 'object' ? card.social_links : {}

                    return (
                        <div key={card.id} className="w-full flex-shrink-0 snap-center px-2 pt-4">
                            <div className="transform scale-[0.85] origin-top-center -mb-12 sm:scale-95 sm:mb-0 transition-transform">
                                <Link href={`/c/${userId}?card=${card.id}`} className="block hover:opacity-95 transition-opacity">
                                    <div className="pointer-events-none"> {/* Disable interaction within carousel preview to allow clicking the whole card to view detail */}
                                        <Template
                                            card={card}
                                            visibleFields={visibleFields}
                                            socialLinks={socialLinks}
                                            onGenerateVCard={() => { }} // No action in preview
                                            readonly={true}
                                        />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Dots */}
            {cards.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2 mb-1">
                    {cards.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activeIndex ? 'bg-blue-600 w-3' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Swipe Hint */}
            {cards.length > 1 && (
                <div className="text-center pb-2">
                    <span className="text-[10px] text-gray-400 font-medium">Swipe untuk lihat kartu lain</span>
                </div>
            )}
        </div>
    )
}
