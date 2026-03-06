'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useKTA, KTATemplate, KTAApplication, KTANumberStats } from '@/hooks/useKTA'
import { uploadToCloudinary } from '@/lib/cloudinary'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function KTAManagementPage() {
    const params = useParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { fetchOrganization, checkMembership } = useOrganizations()
    const {
        loading: ktaLoading,
        error: ktaError,
        fetchTemplate,
        saveTemplate,
        uploadNumbers,
        fetchNumberStats,
        deleteUnusedNumbers,
        fetchAllApplications,
    } = useKTA()

    const orgId = params.id as string

    const [org, setOrg] = useState<any>(null)
    const [membership, setMembership] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'template' | 'numbers' | 'generated'>('template')

    // Template state
    const [template, setTemplate] = useState<KTATemplate | null>(null)
    const [templateImageUrl, setTemplateImageUrl] = useState('')
    const [uploadingTemplate, setUploadingTemplate] = useState(false)
    const [fieldPositions, setFieldPositions] = useState({
        name: { x: 20, y: 120, width: 180, height: 30, fontSize: 14, fontColor: '#000000' },
        kta_number: { x: 20, y: 155, width: 180, height: 20, fontSize: 11, fontColor: '#333333' },
        photo: { x: 290, y: 40, width: 80, height: 100 },
        qrcode: { x: 295, y: 155, width: 60, height: 60 },
    })
    const [savingTemplate, setSavingTemplate] = useState(false)
    const [templateSuccess, setTemplateSuccess] = useState('')

    // Numbers state
    const [numberStats, setNumberStats] = useState<KTANumberStats | null>(null)
    const [numbersList, setNumbersList] = useState<any[]>([])
    const [uploadingNumbers, setUploadingNumbers] = useState(false)
    const [numbersSuccess, setNumbersSuccess] = useState('')

    // Generated KTAs state
    const [applications, setApplications] = useState<KTAApplication[]>([])

    // Refs
    const templateInputRef = useRef<HTMLInputElement>(null)
    const numbersInputRef = useRef<HTMLInputElement>(null)

    // Dragging state for field positioning
    const [draggingField, setDraggingField] = useState<string | null>(null)
    const previewRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (user && orgId) {
            loadData()
        }
    }, [user, orgId])

    const loadData = async () => {
        const [orgData, membershipData] = await Promise.all([
            fetchOrganization(orgId),
            checkMembership(orgId),
        ])
        setOrg(orgData)
        setMembership(membershipData)

        if (!membershipData.isAdmin) {
            router.push(`/dashboard/organizations/${orgId}`)
            return
        }

        // Load KTA data
        const [templateData, numbersData, appsData] = await Promise.all([
            fetchTemplate(orgId),
            fetchNumberStats(orgId),
            fetchAllApplications(orgId),
        ])

        if (templateData) {
            setTemplate(templateData)
            setTemplateImageUrl(templateData.template_image_url)
            const fp = templateData.field_positions
            setFieldPositions({
                name: { x: fp.name.x, y: fp.name.y, width: fp.name.width, height: fp.name.height, fontSize: fp.name.fontSize || 14, fontColor: fp.name.fontColor || '#000000' },
                kta_number: { x: fp.kta_number.x, y: fp.kta_number.y, width: fp.kta_number.width, height: fp.kta_number.height, fontSize: fp.kta_number.fontSize || 11, fontColor: fp.kta_number.fontColor || '#333333' },
                photo: { x: fp.photo.x, y: fp.photo.y, width: fp.photo.width, height: fp.photo.height },
                qrcode: { x: fp.qrcode.x, y: fp.qrcode.y, width: fp.qrcode.width, height: fp.qrcode.height },
            })
        }

        if (numbersData) {
            setNumberStats(numbersData.stats)
            setNumbersList(numbersData.numbers)
        }

        setApplications(appsData)
    }

    // Handle template image upload
    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate PNG
        if (!file.type.includes('png')) {
            alert('Hanya file PNG yang diperbolehkan')
            return
        }

        // Validate dimensions (approximate for 8.7cm × 5.5cm)
        const img = new window.Image()
        img.onload = async () => {
            const ratio = img.width / img.height
            const expectedRatio = 8.7 / 5.5
            // Allow some tolerance
            if (Math.abs(ratio - expectedRatio) > 0.3) {
                const proceed = confirm(
                    `Rasio template (${ratio.toFixed(2)}) berbeda dari yang direkomendasikan (${expectedRatio.toFixed(2)} untuk 8.7cm × 5.5cm). Lanjutkan?`
                )
                if (!proceed) return
            }

            setUploadingTemplate(true)
            try {
                const result = await uploadToCloudinary(file, 'official-id/kta-templates')
                setTemplateImageUrl(result.secure_url)
            } catch (err: any) {
                alert('Gagal upload template: ' + err.message)
            } finally {
                setUploadingTemplate(false)
            }
        }
        img.src = URL.createObjectURL(file)
    }

    // Save template config
    const handleSaveTemplate = async () => {
        if (!templateImageUrl) {
            alert('Upload template image terlebih dahulu')
            return
        }

        setSavingTemplate(true)
        setTemplateSuccess('')
        try {
            const result = await saveTemplate(orgId, templateImageUrl, fieldPositions)
            if (result) {
                setTemplate(result)
                setTemplateSuccess('Template berhasil disimpan!')
                setTimeout(() => setTemplateSuccess(''), 3000)
            }
        } finally {
            setSavingTemplate(false)
        }
    }

    // Handle Excel upload for KTA numbers
    const handleNumbersUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingNumbers(true)
        setNumbersSuccess('')
        try {
            const result = await uploadNumbers(orgId, file)
            if (result) {
                setNumbersSuccess(
                    `Berhasil upload ${result.uploaded} nomor KTA.${result.duplicatesSkipped > 0 ? ` ${result.duplicatesSkipped} duplikat dilewati.` : ''}`
                )
                // Reload numbers
                const numbersData = await fetchNumberStats(orgId)
                if (numbersData) {
                    setNumberStats(numbersData.stats)
                    setNumbersList(numbersData.numbers)
                }
            }
        } finally {
            setUploadingNumbers(false)
            if (numbersInputRef.current) numbersInputRef.current.value = ''
        }
    }

    // Handle delete unused numbers
    const handleDeleteUnused = async () => {
        if (!confirm('Hapus semua nomor KTA yang belum digunakan?')) return
        const success = await deleteUnusedNumbers(orgId)
        if (success) {
            const numbersData = await fetchNumberStats(orgId)
            if (numbersData) {
                setNumberStats(numbersData.stats)
                setNumbersList(numbersData.numbers)
            }
        }
    }

    // Field drag handlers
    const handleFieldMouseDown = (field: string, e: React.MouseEvent) => {
        e.preventDefault()
        setDraggingField(field)
    }

    const handlePreviewMouseMove = (e: React.MouseEvent) => {
        if (!draggingField || !previewRef.current) return
        const rect = previewRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))

        setFieldPositions(prev => ({
            ...prev,
            [draggingField]: {
                ...prev[draggingField as keyof typeof prev],
                x: Math.round(x),
                y: Math.round(y),
            }
        }))
    }

    const handlePreviewMouseUp = () => {
        setDraggingField(null)
    }

    if (authLoading || !org) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Preview dimensions (400px wide preview)
    const PREVIEW_WIDTH = 400
    const PREVIEW_HEIGHT = Math.round(400 * (5.5 / 8.7))

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <Link href={`/dashboard/organizations/${orgId}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            ← Kembali ke Circle
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">KTA Management</h1>
                            <p className="text-sm text-gray-500">{org.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2">
                    {[
                        { key: 'template', label: 'Template Desain', icon: '🎨' },
                        { key: 'numbers', label: 'Nomor KTA', icon: '🔢' },
                        { key: 'generated', label: 'KTA Terbit', icon: '📋' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === tab.key
                                ? 'bg-amber-50 text-amber-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Error display */}
            {ktaError && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                        {ktaError}
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* =================== TEMPLATE TAB =================== */}
                {activeTab === 'template' && (
                    <div className="space-y-6">
                        {/* Upload Template */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Template Desain KTA</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Upload file PNG dengan ukuran lebar 8,7 cm × tinggi 5,5 cm. Template ini akan menjadi background kartu anggota.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <button
                                    onClick={() => templateInputRef.current?.click()}
                                    disabled={uploadingTemplate}
                                    className="px-6 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {uploadingTemplate ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Upload Template PNG
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={templateInputRef}
                                    type="file"
                                    accept=".png"
                                    onChange={handleTemplateUpload}
                                    className="hidden"
                                />
                                {templateImageUrl && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Template uploaded
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Template Preview & Field Positioning */}
                        {templateImageUrl && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Posisi Field pada Template</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Drag field di bawah ini untuk menentukan posisi Nama, No KTA, Photo, dan QR Code pada template.
                                </p>

                                {/* Preview Canvas */}
                                <div
                                    ref={previewRef}
                                    className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden mx-auto cursor-crosshair select-none"
                                    style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
                                    onMouseMove={handlePreviewMouseMove}
                                    onMouseUp={handlePreviewMouseUp}
                                    onMouseLeave={handlePreviewMouseUp}
                                >
                                    {/* Template Background */}
                                    <Image
                                        src={templateImageUrl}
                                        alt="KTA Template"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />

                                    {/* Name Field */}
                                    <div
                                        className="absolute border-2 border-blue-500 bg-blue-100/50 rounded cursor-move flex items-center justify-center text-xs text-blue-700 font-medium"
                                        style={{
                                            left: fieldPositions.name.x,
                                            top: fieldPositions.name.y,
                                            width: fieldPositions.name.width,
                                            height: fieldPositions.name.height,
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown('name', e)}
                                    >
                                        📝 NAMA
                                    </div>

                                    {/* KTA Number Field */}
                                    <div
                                        className="absolute border-2 border-green-500 bg-green-100/50 rounded cursor-move flex items-center justify-center text-xs text-green-700 font-medium"
                                        style={{
                                            left: fieldPositions.kta_number.x,
                                            top: fieldPositions.kta_number.y,
                                            width: fieldPositions.kta_number.width,
                                            height: fieldPositions.kta_number.height,
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown('kta_number', e)}
                                    >
                                        🔢 NO. KTA
                                    </div>

                                    {/* Photo Field */}
                                    <div
                                        className="absolute border-2 border-purple-500 bg-purple-100/50 rounded cursor-move flex items-center justify-center text-xs text-purple-700 font-medium"
                                        style={{
                                            left: fieldPositions.photo.x,
                                            top: fieldPositions.photo.y,
                                            width: fieldPositions.photo.width,
                                            height: fieldPositions.photo.height,
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown('photo', e)}
                                    >
                                        📷 PHOTO
                                    </div>

                                    {/* QR Code Field */}
                                    <div
                                        className="absolute border-2 border-orange-500 bg-orange-100/50 rounded cursor-move flex items-center justify-center text-xs text-orange-700 font-medium"
                                        style={{
                                            left: fieldPositions.qrcode.x,
                                            top: fieldPositions.qrcode.y,
                                            width: fieldPositions.qrcode.width,
                                            height: fieldPositions.qrcode.height,
                                        }}
                                        onMouseDown={(e) => handleFieldMouseDown('qrcode', e)}
                                    >
                                        QR
                                    </div>
                                </div>

                                {/* Field Size Controls */}
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(['name', 'kta_number', 'photo', 'qrcode'] as const).map(field => {
                                        const labels = { name: 'Nama', kta_number: 'No. KTA', photo: 'Photo', qrcode: 'QR Code' }
                                        const colors = { name: 'blue', kta_number: 'green', photo: 'purple', qrcode: 'orange' }
                                        const pos = fieldPositions[field]
                                        return (
                                            <div key={field} className={`p-3 rounded-xl border border-${colors[field]}-200 bg-${colors[field]}-50/50`}>
                                                <p className="text-sm font-medium text-gray-700 mb-2">{labels[field]}</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <label className="flex items-center gap-1">
                                                        W:
                                                        <input
                                                            type="number"
                                                            value={pos.width}
                                                            onChange={e => setFieldPositions(p => ({
                                                                ...p,
                                                                [field]: { ...p[field], width: Number(e.target.value) }
                                                            }))}
                                                            className="w-16 px-2 py-1 border rounded text-center"
                                                        />
                                                    </label>
                                                    <label className="flex items-center gap-1">
                                                        H:
                                                        <input
                                                            type="number"
                                                            value={pos.height}
                                                            onChange={e => setFieldPositions(p => ({
                                                                ...p,
                                                                [field]: { ...p[field], height: Number(e.target.value) }
                                                            }))}
                                                            className="w-16 px-2 py-1 border rounded text-center"
                                                        />
                                                    </label>
                                                    {'fontSize' in pos && (
                                                        <>
                                                            <label className="flex items-center gap-1">
                                                                Size:
                                                                <input
                                                                    type="number"
                                                                    value={(pos as any).fontSize || 14}
                                                                    onChange={e => setFieldPositions(p => ({
                                                                        ...p,
                                                                        [field]: { ...p[field as keyof typeof p], fontSize: Number(e.target.value) }
                                                                    }))}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </label>
                                                            <label className="flex items-center gap-1">
                                                                Color:
                                                                <input
                                                                    type="color"
                                                                    value={(pos as any).fontColor || '#000000'}
                                                                    onChange={e => setFieldPositions(p => ({
                                                                        ...p,
                                                                        [field]: { ...p[field as keyof typeof p], fontColor: e.target.value }
                                                                    }))}
                                                                    className="w-8 h-6 border rounded cursor-pointer"
                                                                />
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Save Button */}
                                <div className="mt-6 flex items-center gap-4">
                                    <button
                                        onClick={handleSaveTemplate}
                                        disabled={savingTemplate || ktaLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {savingTemplate ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Simpan Template
                                            </>
                                        )}
                                    </button>
                                    {templateSuccess && (
                                        <span className="text-sm text-green-600 font-medium">{templateSuccess}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* =================== NUMBERS TAB =================== */}
                {activeTab === 'numbers' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Total Nomor', value: numberStats?.total || 0, color: 'blue' },
                                { label: 'Sudah Digunakan', value: numberStats?.used || 0, color: 'green' },
                                { label: 'Tersedia', value: numberStats?.available || 0, color: 'amber' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
                                    <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                                    <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Upload */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Nomor KTA</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                Upload file Excel (.xlsx) berisi 1 kolom daftar nomor KTA. Nomor akan digunakan secara berurutan.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <button
                                    onClick={() => numbersInputRef.current?.click()}
                                    disabled={uploadingNumbers}
                                    className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {uploadingNumbers ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Upload Excel
                                        </>
                                    )}
                                </button>
                                <input
                                    ref={numbersInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleNumbersUpload}
                                    className="hidden"
                                />

                                {(numberStats?.available || 0) > 0 && (
                                    <button
                                        onClick={handleDeleteUnused}
                                        className="px-4 py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors text-sm"
                                    >
                                        Hapus Nomor Belum Digunakan
                                    </button>
                                )}
                            </div>

                            {numbersSuccess && (
                                <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200">
                                    {numbersSuccess}
                                </div>
                            )}
                        </div>

                        {/* Numbers List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Daftar Nomor KTA ({numbersList.length})
                            </h2>
                            {numbersList.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">Belum ada nomor KTA. Upload file Excel untuk menambahkan.</p>
                            ) : (
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white">
                                            <tr className="border-b">
                                                <th className="text-left py-2 px-3 text-gray-500 font-medium">#</th>
                                                <th className="text-left py-2 px-3 text-gray-500 font-medium">Nomor KTA</th>
                                                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {numbersList.map((num, i) => (
                                                <tr key={num.id} className="border-b last:border-0 hover:bg-gray-50">
                                                    <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                                                    <td className="py-2 px-3 font-mono font-medium text-gray-900">{num.kta_number}</td>
                                                    <td className="py-2 px-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${num.is_used
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {num.is_used ? 'Digunakan' : 'Tersedia'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* =================== GENERATED TAB =================== */}
                {activeTab === 'generated' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                KTA Terbit ({applications.length})
                            </h2>

                            {applications.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500">Belum ada KTA yang diterbitkan</p>
                                    <p className="text-sm text-gray-400 mt-1">Member circle dapat mengajukan KTA melalui landing page circle</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {applications.map((app) => (
                                        <div
                                            key={app.id}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                                        >
                                            {/* Photo */}
                                            <div className="flex-shrink-0">
                                                {app.photo_url ? (
                                                    <Image
                                                        src={app.photo_url}
                                                        alt={app.full_name}
                                                        width={48}
                                                        height={48}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <span className="text-lg font-bold text-gray-500">
                                                            {app.full_name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{app.full_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {app.kta_numbers?.kta_number || 'No KTA'} • {app.company || '-'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>

                                            {/* Status */}
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${app.status === 'GENERATED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : app.status === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {app.status === 'GENERATED' ? 'Terbit' : app.status === 'PENDING' ? 'Proses' : 'Gagal'}
                                                </span>

                                                {app.gdrive_pdf_url && (
                                                    <a
                                                        href={app.gdrive_pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <BottomNavigation variant="organizations" />
        </div>
    )
}
