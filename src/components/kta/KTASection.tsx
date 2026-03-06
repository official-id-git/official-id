'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useKTA, KTAApplication } from '@/hooks/useKTA'

interface KTASectionProps {
    organizationId: string
    organizationName: string
    isMember: boolean
}

export default function KTASection({ organizationId, organizationName, isMember }: KTASectionProps) {
    const { user } = useAuth()
    const {
        loading,
        error,
        fetchTemplate,
        fetchMyKTA,
        applyForKTA,
    } = useKTA()

    const [hasTemplate, setHasTemplate] = useState(false)
    const [myKTA, setMyKTA] = useState<KTAApplication | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [formSubmitting, setFormSubmitting] = useState(false)
    const [formSuccess, setFormSuccess] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const photoInputRef = useRef<HTMLInputElement>(null)

    // Form fields
    const [formData, setFormData] = useState({
        fullName: '',
        company: '',
        birthPlace: '',
        birthDate: '',
        professionalCompetency: '',
        photoUrl: '',
        city: '',
        province: '',
        whatsappNumber: '',
    })

    useEffect(() => {
        loadKTAData()
    }, [organizationId, user, isMember, fetchTemplate, fetchMyKTA])

    const loadKTAData = async () => {
        // Check if template exists
        const template = await fetchTemplate(organizationId)
        setHasTemplate(!!template)

        // If user is member, check their KTA and fetch profile data
        if (user && isMember) {
            const kta = await fetchMyKTA(organizationId)
            setMyKTA(kta)

            // Pre-fill form from user profile + business card data
            if (!kta) {
                try {
                    const { createClient } = await import('@/lib/supabase/client')
                    const supabase = createClient()

                    // Fetch full user profile
                    const { data: profile } = await supabase
                        .from('users')
                        .select('full_name, email, phone, company, city, avatar_url, birth_place, birth_date, province, professional_competency')
                        .eq('id', user.id)
                        .maybeSingle()

                    // Fetch primary business card
                    const { data: cards } = await supabase
                        .from('business_cards')
                        .select('full_name, company, job_title, phone, city, profile_photo_url, email')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1)

                    const p: any = profile || {}
                    const card: any = (cards && cards.length > 0) ? cards[0] : {}

                    setFormData(prev => ({
                        ...prev,
                        fullName: p.full_name || card.full_name || user.full_name || '',
                        company: p.company || card.company || '',
                        birthPlace: p.birth_place || '',
                        birthDate: p.birth_date || '',
                        professionalCompetency: p.professional_competency || card.job_title || '',
                        city: p.city || card.city || '',
                        province: p.province || '',
                        whatsappNumber: p.phone || card.phone || '',
                        photoUrl: card.profile_photo_url || p.avatar_url || '',
                    }))
                } catch (err) {
                    console.error('Error fetching profile data for KTA:', err)
                    // Fallback to basic user data
                    setFormData(prev => ({
                        ...prev,
                        fullName: user.full_name || '',
                    }))
                }
            }
        }
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingPhoto(true)
        try {
            const cloudFormData = new FormData()
            cloudFormData.append('file', file)
            cloudFormData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'officialiddata')
            cloudFormData.append('folder', 'official-id/kta-photos')

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: cloudFormData }
            )

            if (res.ok) {
                const data = await res.json()
                setFormData(prev => ({ ...prev, photoUrl: data.secure_url }))
            } else {
                throw new Error('Upload gagal')
            }
        } catch (err: any) {
            alert('Gagal upload foto: ' + err.message)
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.fullName || !formData.photoUrl) {
            alert('Nama lengkap dan foto wajib diisi')
            return
        }

        setFormSubmitting(true)
        try {
            const result = await applyForKTA(organizationId, formData)
            if (result) {
                setFormSuccess(true)
                setMyKTA(result)
                setShowForm(false)
            }
        } finally {
            setFormSubmitting(false)
        }
    }

    // Don't show section if no template configured
    if (!hasTemplate) return null

    return (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                    Kartu Tanda Anggota (KTA)
                </h2>
                <p className="text-white/80 text-sm mt-1">Dapatkan Kartu Tanda Anggota resmi dari {organizationName}</p>
            </div>

            <div className="p-6">
                {/* Error Display */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                        {error}
                    </div>
                )}

                {/* Not a member */}
                {!isMember && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 font-medium">Bergabung dengan circle untuk mendapatkan KTA</p>
                        <p className="text-sm text-gray-400 mt-1">Hanya anggota yang sudah disetujui yang dapat mengajukan KTA</p>
                    </div>
                )}

                {/* Member: Already has KTA */}
                {isMember && myKTA && myKTA.status === 'GENERATED' && (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-green-800">KTA Anda sudah terbit!</p>
                                <p className="text-sm text-green-600">
                                    No. KTA: <strong className="font-mono">{myKTA.kta_numbers?.kta_number || '-'}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Download Links */}
                        <div className="flex gap-3">
                            {myKTA.gdrive_pdf_url && (
                                <a
                                    href={myKTA.gdrive_pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download KTA (PDF)
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Member: Has pending KTA */}
                {isMember && myKTA && myKTA.status === 'PENDING' && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-3"></div>
                        <p className="font-medium text-yellow-800">KTA sedang dalam proses pembuatan...</p>
                        <p className="text-sm text-yellow-600 mt-1">Mohon tunggu, KTA Anda sedang dibuat.</p>
                    </div>
                )}

                {/* Member: No KTA yet - Show Apply Button */}
                {isMember && !myKTA && !showForm && !formSuccess && (
                    <div className="text-center py-6">
                        <p className="text-gray-600 mb-4">Anda belum memiliki KTA untuk circle ini.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                        >
                            Ajukan KTA Sekarang
                        </button>
                    </div>
                )}

                {/* Success message after applying */}
                {formSuccess && !myKTA?.gdrive_pdf_url && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                        <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="font-medium text-green-800">KTA berhasil dibuat!</p>
                        <p className="text-sm text-green-600 mt-1">KTA Anda telah diterbitkan. Refresh halaman untuk melihat detail.</p>
                    </div>
                )}

                {/* KTA Application Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Pengajuan KTA</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="Nama sesuai identitas"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan / Organisasi</label>
                                <input
                                    type="text"
                                    value={formData.company}
                                    onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kompetensi Profesional</label>
                                <input
                                    type="text"
                                    value={formData.professionalCompetency}
                                    onChange={e => setFormData(prev => ({ ...prev, professionalCompetency: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="Contoh: Web Developer"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir</label>
                                <input
                                    type="text"
                                    value={formData.birthPlace}
                                    onChange={e => setFormData(prev => ({ ...prev, birthPlace: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                                <input
                                    type="text"
                                    value={formData.province}
                                    onChange={e => setFormData(prev => ({ ...prev, province: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
                            <input
                                type="tel"
                                value={formData.whatsappNumber}
                                onChange={e => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value.replace(/[^0-9+]/g, '') }))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>

                        {/* Photo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Foto KTA <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-4">
                                {formData.photoUrl ? (
                                    <div className="relative w-24 h-30 rounded-xl overflow-hidden border-2 border-amber-300">
                                        <Image
                                            src={formData.photoUrl}
                                            alt="Photo KTA"
                                            width={96}
                                            height={120}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => photoInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="w-24 h-30 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
                                    >
                                        {uploadingPhoto ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs">Upload</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                <input
                                    ref={photoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                <p className="text-xs text-gray-400">Foto formal pas foto, ukuran 3x4 atau 4x6</p>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={formSubmitting || loading || !formData.photoUrl}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {formSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Generating KTA...
                                    </>
                                ) : (
                                    'Ajukan KTA'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
