'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import SendMessageModal from '@/components/messages/SendMessageModal'
import type { Organization, OrganizationMember } from '@/types'

interface PublicCircleClientProps {
    circleUsername: string
}

export default function PublicCircleClient({ circleUsername }: PublicCircleClientProps) {
    const router = useRouter()
    const { user } = useAuth()
    const { fetchOrganization, fetchMembers, joinOrganization, checkMembership, loading } = useOrganizations()

    const [org, setOrg] = useState<Organization | null>(null)
    const [members, setMembers] = useState<OrganizationMember[]>([])
    const [pageLoading, setPageLoading] = useState(true)
    const [membershipStatus, setMembershipStatus] = useState<string | null>(null)
    const [isOwner, setIsOwner] = useState(false)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Search and Sort state
    const [searchQuery, setSearchQuery] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Message modal state
    const [messageModalOpen, setMessageModalOpen] = useState(false)
    const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string } | null>(null)

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

            if (!orgData.is_public) {
                setError('Circle ini bersifat privat. Anda memerlukan undangan untuk mengakses.')
                return
            }

            setOrg(orgData)

            // Fetch approved members with business cards
            const membersData = await fetchMembers(orgData.id)
            const approvedMembers = membersData.filter(m => m.status === 'APPROVED')
            setMembers(approvedMembers)

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
                                    <Image src={org.logo_url} alt={org.name} width={128} height={128} className="w-full h-full object-cover" />
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
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                            Publik
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

                            {/* Stats */}
                            <div className="flex items-center gap-6 mb-6">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="font-semibold">{members.length}</span>
                                    <span>Anggota</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {!user ? (
                                    <Link
                                        href={`/login?redirect=/o/${circleUsername}`}
                                        className="flex-1 py-3 bg-blue-600 text-white text-center rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Login untuk Bergabung
                                    </Link>
                                ) : isOwner ? (
                                    <Link
                                        href={`/dashboard/organizations/${org.id}`}
                                        className="flex-1 py-3 bg-blue-600 text-white text-center rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        Kelola Circle
                                    </Link>
                                ) : isMember ? (
                                    <Link
                                        href={`/dashboard/organizations/${org.id}`}
                                        className="flex-1 py-3 bg-green-600 text-white text-center rounded-xl font-medium hover:bg-green-700 transition-colors"
                                    >
                                        ✓ Sudah Bergabung - Lihat Detail
                                    </Link>
                                ) : isPending ? (
                                    <button
                                        disabled
                                        className="flex-1 py-3 bg-yellow-100 text-yellow-700 text-center rounded-xl font-medium cursor-not-allowed"
                                    >
                                        Menunggu Persetujuan
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleJoin}
                                        disabled={joining}
                                        className="flex-1 py-3 bg-blue-600 text-white text-center rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        {joining ? 'Memproses...' : 'Bergabung dengan Circle'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members List */}
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
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
        <div className="relative pb-6 bg-gray-50">
            {/* Scroll Container */}
            <div
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {cards.map((card, idx) => {
                    const Template = getTemplateComponent(card.template)
                    // Ensure visible_fields is an object
                    const visibleFields = typeof card.visible_fields === 'object' ? card.visible_fields : {}
                    const socialLinks = typeof card.social_links === 'object' ? card.social_links : {}

                    // IMPORTANT: Ensure show_business_description is passed if it's not in visibleFields (it's a top level prop in card now, but templates might look for it in card object)
                    // The templates use `card.show_business_description`.

                    return (
                        <div key={card.id} className="w-full flex-shrink-0 snap-center p-4">
                            <div className="transform scale-[0.85] origin-top-center -mb-8 sm:scale-95 sm:mb-0 transition-transform">
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
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
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
                <div className="absolute bottom-0 left-0 right-0 text-center">
                    <span className="text-[10px] text-gray-400 font-medium">Swipe untuk lihat kartu lain</span>
                </div>
            )}
        </div>
    )
}
