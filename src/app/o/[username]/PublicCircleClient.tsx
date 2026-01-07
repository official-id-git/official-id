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

            // Fetch approved members
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

    const handleShareWhatsApp = () => {
        if (!org) return
        const url = `https://official.id/o/${circleUsername}`
        const text = `Yuk gabung Circle ${org.name} di Official ID!`
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
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

                                {/* Share Button */}
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    <span>Bagikan</span>
                                </button>
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
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    {member.users?.avatar_url ? (
                                        <Image
                                            src={member.users.avatar_url}
                                            alt={member.users.full_name}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-lg">
                                                {member.users?.full_name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">
                                            {member.users?.full_name || 'Anonymous'}
                                        </p>
                                        {member.is_admin && (
                                            <span className="text-xs text-blue-600 font-medium">Admin</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
