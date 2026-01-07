'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Anggota Circle</h2>

                    {members.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Belum ada anggota yang bergabung</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {members.map((member: any) => {
                                const userData = member.users || {}
                                const userName = userData.full_name || 'Anonymous'
                                const userAvatar = userData.avatar_url

                                // Get first public business card
                                const businessCards = member.business_cards || []
                                const publicCard = businessCards.find((card: any) => card.is_public)

                                // Link to public card if available
                                const cardLink = publicCard
                                    ? `/c/${publicCard.username || publicCard.id}`
                                    : null

                                const CardContent = () => (
                                    <>
                                        {userAvatar ? (
                                            <Image
                                                src={userAvatar}
                                                alt={userName}
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-lg">
                                                    {userName.charAt(0) || '?'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">
                                                {userName}
                                            </p>
                                            {member.is_admin && (
                                                <span className="text-xs text-blue-600 font-medium">Admin</span>
                                            )}
                                            {!publicCard && (
                                                <span className="text-xs text-gray-400">Kartu tidak tersedia</span>
                                            )}
                                        </div>
                                        {cardLink && (
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        )}
                                    </>
                                )

                                return cardLink ? (
                                    <Link
                                        key={member.id}
                                        href={cardLink}
                                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all border border-transparent hover:border-blue-200"
                                    >
                                        <CardContent />
                                    </Link>
                                ) : (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl opacity-60 cursor-not-allowed"
                                    >
                                        <CardContent />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
