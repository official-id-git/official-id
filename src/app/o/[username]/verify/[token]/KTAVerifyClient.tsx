'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface KTAVerifyData {
    kta: {
        id: string
        fullName: string
        company: string | null
        ktaNumber: string
        photoUrl: string
        city: string | null
        province: string | null
        professionalCompetency: string | null
        generatedCardUrl: string | null
        gdrivePdfUrl: string | null
        createdAt: string
        status: string
    }
    organization: {
        id: string
        name: string
        username: string
        logo_url: string | null
        description: string | null
    }
    user: {
        fullName: string
        email: string
        avatarUrl: string | null
    }
    businessCard: any | null
}

interface Props {
    username: string
    token: string
}

export default function KTAVerifyClient({ username, token }: Props) {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<KTAVerifyData | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        verifyKTA()
    }, [token])

    const verifyKTA = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/kta/verify/${token}`)
            const result = await res.json()

            if (!result.success) {
                throw new Error(result.error || 'KTA not found')
            }

            setData(result.data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Memverifikasi KTA...</p>
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-gray-50 px-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">KTA Tidak Valid</h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'Kartu Tanda Anggota tidak ditemukan atau belum diterbitkan.'}
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                    >
                        Ke Beranda
                    </Link>
                </div>
            </div>
        )
    }

    const { kta, organization, user, businessCard } = data

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
            {/* Header */}
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Official.id" width={32} height={32} className="w-8 h-8 rounded-lg" unoptimized />
                        <span className="font-bold text-gray-900">Official.id</span>
                    </Link>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                        ✓ Terverifikasi
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                {/* Verification Badge */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white text-center shadow-lg">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-1">KTA Terverifikasi</h1>
                    <p className="text-white/80 text-sm">Kartu Tanda Anggota ini sah dan resmi diterbitkan</p>
                </div>

                {/* KTA Details Card */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    {/* Organization Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex flex-col items-center justify-center text-center gap-4">
                        {organization.logo_url ? (
                            <div className="h-20 max-w-[240px] relative flex justify-center bg-white p-2 rounded-xl shadow-md">
                                <img
                                    src={organization.logo_url}
                                    alt={organization.name}
                                    className="h-full w-auto object-contain"
                                />
                            </div>
                        ) : (
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                                <span className="text-3xl font-bold text-white">{organization.name.charAt(0)}</span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">{organization.name}</h2>
                            <p className="text-white/80 text-sm mt-1">Kartu Tanda Anggota</p>
                        </div>
                    </div>

                    {/* Member Details */}
                    <div className="p-6">
                        <div className="flex items-start gap-5 mb-6">
                            {/* Photo */}
                            <div className="flex-shrink-0">
                                {kta.photoUrl ? (
                                    <div className="w-24 h-30 rounded-xl overflow-hidden border-2 border-gray-200 shadow-md">
                                        <Image
                                            src={kta.photoUrl}
                                            alt={kta.fullName}
                                            width={96}
                                            height={120}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="w-24 h-30 bg-gray-200 rounded-xl flex items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-400">{kta.fullName.charAt(0)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{kta.fullName}</h3>
                                <p className="text-amber-600 font-mono font-medium text-sm mb-3">No. KTA: {kta.ktaNumber}</p>

                                <div className="space-y-2 text-sm">
                                    {kta.company && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>{kta.company}</span>
                                        </div>
                                    )}
                                    {kta.professionalCompetency && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span>{kta.professionalCompetency}</span>
                                        </div>
                                    )}
                                    {(kta.city || kta.province) && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{[kta.city, kta.province].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Issue Date */}
                        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Tanggal Terbit</span>
                            <span className="font-medium text-gray-700">
                                {new Date(kta.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Business Card Link */}
                {businessCard && (
                    <div className="bg-white rounded-3xl shadow-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <span>💳</span>
                            Kartu Nama Digital
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Lihat kartu nama digital {kta.fullName}
                        </p>
                        <Link
                            href={`/c/${businessCard.slug || businessCard.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Lihat Kartu Nama
                        </Link>
                    </div>
                )}

                {/* Circle Link */}
                <div className="text-center">
                    <Link
                        href={`/o/${username}`}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                        Kunjungi Circle {organization.name} →
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t mt-8">
                <div className="max-w-3xl mx-auto px-4 py-4 text-center">
                    <p className="text-sm text-gray-500">
                        Verifikasi oleh <Link href="/" className="text-blue-600 font-medium hover:text-blue-700">Official.id</Link> • Platform Kartu Nama Digital & Circle Management
                    </p>
                </div>
            </div>
        </div>
    )
}
