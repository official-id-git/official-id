'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ReactQRCode from 'react-qr-code'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useKTA, KTATemplate, KTAApplication, KTANumberStats } from '@/hooks/useKTA'
import { uploadToCloudinary } from '@/lib/cloudinary'
import BottomNavigation from '@/components/layout/BottomNavigation'
import KTACardGenerator, { KTACardGeneratorRef } from '@/components/kta/KTACardGenerator'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PromptModal from '@/components/ui/PromptModal'
import KTASection from '@/components/kta/KTASection'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

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
        addSingleNumber,
        fetchAllApplications,
        approveKTA,
        rejectKTA,
        regenerateKTA,
    } = useKTA()

    const orgId = params.id as string

    const [org, setOrg] = useState<any>(null)
    const [membership, setMembership] = useState<any>(null)
    const [viewMode, setViewMode] = useState<'management' | 'personal'>('management')
    const [activeTab, setActiveTab] = useState<'template' | 'numbers' | 'pending' | 'generated'>('template')

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
    const [manualNumber, setManualNumber] = useState('')
    const [manualNumberError, setManualNumberError] = useState('')
    const [addingManualNumber, setAddingManualNumber] = useState(false)

    // Applications state
    const [applications, setApplications] = useState<KTAApplication[]>([])
    const pendingApps = applications.filter(a => a.status === 'PENDING')
    const generatedApps = applications.filter(a => a.status === 'GENERATED')

    // Approval Modal state
    const [approvalModalApp, setApprovalModalApp] = useState<KTAApplication | null>(null)
    const [editFormData, setEditFormData] = useState<any>({})
    const [validatingApproval, setValidatingApproval] = useState(false)

    // Rejection & Regeneration state
    const [isRejecting, setIsRejecting] = useState(false)
    const [regeneratingAppId, setRegeneratingAppId] = useState<string | null>(null)
    const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false)
    const [selectedAppForRegenerate, setSelectedAppForRegenerate] = useState<KTAApplication | null>(null)
    const [rejectionReason, setRejectionReason] = useState('')
    const [showRejectInput, setShowRejectInput] = useState(false)

    // Edit Generated KTA state
    const [isEditGeneratedModalOpen, setIsEditGeneratedModalOpen] = useState(false)
    const [selectedAppForEdit, setSelectedAppForEdit] = useState<KTAApplication | null>(null)
    const [editGeneratedData, setEditGeneratedData] = useState<any>({})
    const [isUpdatingData, setIsUpdatingData] = useState(false)

    // Modal states
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, isDestructive: false })
    const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', onConfirm: (val: string) => { } })

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
            toast.error('Hanya file PNG yang diperbolehkan')
            return
        }

        // Validate dimensions (approximate for 8.7cm × 5.5cm)
        const img = new window.Image()
        img.onload = async () => {
            const ratio = img.width / img.height
            const expectedRatio = 8.7 / 5.5
            // Allow some tolerance
            if (Math.abs(ratio - expectedRatio) > 0.3) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Peringatan Dimensi Template',
                    message: `Rasio template (${ratio.toFixed(2)}) berbeda dari yang direkomendasikan (${expectedRatio.toFixed(2)} untuk 8.7cm × 5.5cm). Lanjutkan?`,
                    isDestructive: false,
                    onConfirm: () => {
                        setConfirmModal(prev => ({ ...prev, isOpen: false }))
                        proceedUploadFlow(file)
                    }
                })
            } else {
                proceedUploadFlow(file)
            }
        }
        img.src = URL.createObjectURL(file)
    }

    const proceedUploadFlow = async (file: File) => {
        setUploadingTemplate(true)
        try {
            const result = await uploadToCloudinary(file, 'official-id/kta-templates')
            setTemplateImageUrl(result.secure_url)
            toast.success('Template berhasil diunggah')
        } catch (err: any) {
            toast.error('Gagal upload template: ' + err.message)
        } finally {
            setUploadingTemplate(false)
        }
    }

    // Save template config
    const handleSaveTemplate = async () => {
        if (!templateImageUrl) {
            toast.error('Upload template image terlebih dahulu')
            return
        }

        setSavingTemplate(true)
        setTemplateSuccess('')
        try {
            const result = await saveTemplate(orgId, templateImageUrl, fieldPositions)
            if (result) {
                setTemplate(result)
                toast.success('Template berhasil disimpan!')
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
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Nomor Belum Digunakan',
            message: 'Apakah Anda yakin ingin menghapus semua nomor KTA yang belum digunakan?',
            isDestructive: true,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: true }))
                try {
                    const success = await deleteUnusedNumbers(orgId)
                    if (success) {
                        toast.success('Nomor KTA yang belum digunakan berhasil dihapus')
                        const numbersData = await fetchNumberStats(orgId)
                        if (numbersData) {
                            setNumberStats(numbersData.stats)
                            setNumbersList(numbersData.numbers)
                        }
                    }
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }))
                }
            }
        })
    }

    const handleAddManualNumber = async () => {
        if (!manualNumber.trim()) return
        setAddingManualNumber(true)
        setManualNumberError('')
        setNumbersSuccess('')
        const result = await addSingleNumber(orgId, manualNumber.trim())
        if (result.success) {
            setManualNumber('')
            setNumbersSuccess(`Nomor KTA "${manualNumber.trim()}" berhasil ditambahkan`)
            const numbersData = await fetchNumberStats(orgId)
            if (numbersData) {
                setNumberStats(numbersData.stats)
                setNumbersList(numbersData.numbers)
            }
        } else {
            setManualNumberError(result.error || 'Gagal menambahkan nomor')
        }
        setAddingManualNumber(false)
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

    const ktaGeneratorRef = useRef<KTACardGeneratorRef>(null)
    const [generatingAppId, setGeneratingAppId] = useState<string | null>(null)
    const [generatorUserData, setGeneratorUserData] = useState<any>(null)

    // Helper to setup generator and wait for it
    // dataOverride: explicit data from fresh DB fetch for regenerate
    // ignoreEditForm: when true (regenerate flow), completely bypass stale editFormData state
    const generateClientFiles = async (
        app: KTAApplication,
        ktaNum: string,
        dataOverride?: { fullName?: string; photoUrl?: string },
        ignoreEditForm?: boolean
    ): Promise<{ base64Image: string, base64Pdf: string } | null> => {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://official.id'
        const verificationUrl = `${baseUrl}/o/${org.username || orgId}/verify/${app.verification_token}`

        // Generate QR code data URL first
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 300,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M',
        })

        // Determine which data to use:
        // - Regenerate path (ignoreEditForm=true): ONLY use dataOverride (fresh DB) OR app fields. Never editFormData.
        // - Approve path (ignoreEditForm=false): editFormData takes precedence over app fields.
        const resolvedName = ignoreEditForm
            ? (dataOverride?.fullName || app.full_name)
            : (dataOverride?.fullName ?? editFormData?.fullName ?? app.full_name)
        const resolvedPhoto = ignoreEditForm
            ? (dataOverride?.photoUrl || app.photo_url)
            : (dataOverride?.photoUrl ?? editFormData?.photoUrl ?? app.photo_url)

        setGeneratorUserData({
            fullName: resolvedName,
            ktaNumber: ktaNum,
            photoUrl: resolvedPhoto,
            qrCodeDataUrl,
        })

        // Wait for React to flush state and DOM to render the background template
        await new Promise(resolve => setTimeout(resolve, 800))

        if (!ktaGeneratorRef.current) throw new Error("Generator ref not attached")
        return await ktaGeneratorRef.current.generateFiles()
    }

    const handleApprove = async () => {
        if (!approvalModalApp || !template) return

        setValidatingApproval(true)
        setGeneratingAppId(approvalModalApp.id)

        try {
            // Target KTA number logic (admin choice or auto)
            let chosenKtaNum = ''
            if (editFormData.assignedNumberId) {
                const numObj = numbersList.find(n => n.id === editFormData.assignedNumberId)
                if (numObj) chosenKtaNum = numObj.kta_number
            } else {
                const firstAvail = numbersList.find(n => !n.is_used)
                if (firstAvail) chosenKtaNum = firstAvail.kta_number
            }

            if (!chosenKtaNum) {
                toast.error('Tidak ada nomor KTA yang tersedia. Silakan ketik/tambah nomor baru.')
                return
            }

            // 1. Generate PNG and PDF on the client directly
            const files = await generateClientFiles(approvalModalApp, chosenKtaNum)
            if (!files) {
                toast.error("Gagal merender file KTA pada browser Anda.")
                return
            }

            // 2. Send the pre-rendered base64 files to the backend
            const result = await approveKTA(
                approvalModalApp.id,
                editFormData.assignedNumberId || undefined,
                editFormData,
                files.base64Image,
                files.base64Pdf
            )

            if (result) {
                toast.success('KTA Berhasil Diterbitkan!')
                setApprovalModalApp(null)
                loadData()
            }
        } catch (err: any) {
            toast.error('Terjadi kesalahan: ' + err.message)
        } finally {
            setValidatingApproval(false)
            setGeneratingAppId(null)
        }
    }

    const handleReject = async () => {
        if (!approvalModalApp || !rejectionReason.trim()) return

        setConfirmModal({
            isOpen: true,
            title: 'Tolak / Batalkan Pengajuan KTA',
            message: 'Apakah Anda yakin ingin menolak / membatalkan pengajuan KTA ini?',
            isDestructive: true,
            onConfirm: async () => {
                setIsRejecting(true)
                try {
                    const success = await rejectKTA(approvalModalApp.id, rejectionReason)
                    if (success) {
                        toast.success('Pengajuan KTA berhasil ditolak/dibatalkan.')
                        setApprovalModalApp(null)
                        setShowRejectInput(false)
                        setRejectionReason('')
                        loadData()
                    }
                } finally {
                    setIsRejecting(false)
                }
            }
        })
    }

    const handleDownload = async (type: 'pdf' | 'image', applicationId: string, fullName: string) => {
        try {
            const toastId = toast.loading(`Menyiapkan ${type.toUpperCase()}...`)
            const res = await fetch(`/api/kta/download-${type}?applicationId=${applicationId}`)

            if (!res.ok) {
                const errorText = await res.text()
                throw new Error(errorText || 'Gagal mengunduh KTA')
            }

            const disposition = res.headers.get('content-disposition')
            let filename = `KTA_${fullName.replace(/[^a-zA-Z0-9]/g, '_')}.${type === 'image' ? 'png' : 'pdf'}`
            if (disposition && disposition.indexOf('filename=') !== -1) {
                const matches = /filename="([^"]*)"/.exec(disposition)
                if (matches != null && matches[1]) filename = matches[1]
            }

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()

            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(`Berhasil mengunduh ${type.toUpperCase()}`, { id: toastId })
        } catch (err: any) {
            toast.error(`Gagal mengunduh: ${err.message}`)
        }
    }

    const handleUpdateGeneratedData = async () => {
        if (!selectedAppForEdit) return
        setIsUpdatingData(true)
        try {
            const res = await fetch(`/api/kta/applications/${selectedAppForEdit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editGeneratedData.fullName,
                    company: editGeneratedData.company,
                    professional_competency: editGeneratedData.professionalCompetency,
                    city: editGeneratedData.city,
                    whatsapp_number: editGeneratedData.whatsappNumber,
                    photo_url: editGeneratedData.photoUrl
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update')
            }

            toast.success('Data KTA berhasil diperbarui. Silakan "Regenerate" untuk menerapkan ke gambar/PDF.', { duration: 5000 })
            setIsEditGeneratedModalOpen(false)
            setSelectedAppForEdit(null)
            loadData()
        } catch (err: any) {
            toast.error('Gagal menyimpan data: ' + err.message)
        } finally {
            setIsUpdatingData(false)
        }
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

    // Template editing constants
    const PREVIEW_WIDTH = 496
    const PREVIEW_HEIGHT = 312

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

            {/* View Mode Toggle */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 inline-flex w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('management')}
                        className={`flex-1 sm:flex-none py-2 px-6 rounded-xl text-sm font-medium transition-colors ${viewMode === 'management'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Pusat Manajemen KTA
                    </button>
                    <button
                        onClick={() => setViewMode('personal')}
                        className={`flex-1 sm:flex-none py-2 px-6 rounded-xl text-sm font-medium transition-colors ${viewMode === 'personal'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        KTA Saya (Member)
                    </button>
                </div>
            </div>

            {viewMode === 'personal' ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                    <KTASection
                        organizationId={orgId}
                        organizationName={org.name}
                        isMember={true}
                    />
                </div>
            ) : (
                <>
                    {/* Tabs */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2 overflow-x-auto">
                            {[
                                { key: 'template', label: 'Template Desain', icon: '🎨' },
                                { key: 'numbers', label: 'Nomor KTA', icon: '🔢' },
                                { key: 'pending', label: 'Menunggu Persetujuan', icon: '⏳', count: pendingApps.length },
                                { key: 'generated', label: 'KTA Terbit', icon: '📋' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`flex-none sm:flex-1 py-2.5 px-4 whitespace-nowrap rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 relative ${activeTab === tab.key
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span className="inline">{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                            {tab.count}
                                        </span>
                                    )}
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
                        {/* ... existing template, numbers, pending, generated tabs ... */}

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

                                {/* Manual Add Single Number */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Tambah Nomor KTA Manual</h2>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Tambahkan nomor KTA satu per satu. Nomor harus unik, tidak boleh sama dengan yang sudah ada.
                                    </p>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={manualNumber}
                                            onChange={(e) => { setManualNumber(e.target.value); setManualNumberError('') }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddManualNumber() }}
                                            placeholder="Ketik nomor KTA, mis. IPTIKI00100"
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        />
                                        <button
                                            onClick={handleAddManualNumber}
                                            disabled={addingManualNumber || !manualNumber.trim()}
                                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                                        >
                                            {addingManualNumber ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            )}
                                            Tambah
                                        </button>
                                    </div>
                                    {manualNumberError && (
                                        <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                                            {manualNumberError}
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

                        {/* =================== PENDING TAB =================== */}
                        {activeTab === 'pending' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        ⏳ Menunggu Persetujuan ({pendingApps.length})
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Daftar anggota yang telah mengajukan KTA. Silakan tinjau data, edit jika perlu, pilih nomor KTA (opsional), lalu klik Setujui untuk menerbitkan KTA.
                                    </p>

                                    {pendingApps.length === 0 ? (
                                        <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                <span className="text-2xl">📝</span>
                                            </div>
                                            <p className="text-gray-500 font-medium">Belum ada pengajuan KTA yang pending</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {pendingApps.map((app) => {
                                                const isExpanded = approvalModalApp?.id === app.id;
                                                return (
                                                    <div
                                                        key={app.id}
                                                        className={`flex flex-col rounded-xl border ${isExpanded ? 'border-orange-300 shadow-md ring-1 ring-orange-100' : 'border-orange-200'} bg-white transition-all overflow-hidden`}
                                                    >
                                                        <div className={`flex flex-col sm:flex-row items-center gap-4 p-4 ${isExpanded ? 'bg-orange-50/50' : 'hover:bg-orange-50/20'}`}>
                                                            {/* Photo */}
                                                            <div className="flex-shrink-0">
                                                                {app.photo_url ? (
                                                                    <Image
                                                                        src={app.photo_url}
                                                                        alt={app.full_name}
                                                                        width={64}
                                                                        height={80}
                                                                        className="w-16 h-20 rounded-lg object-cover bg-white p-1 border border-gray-200 shadow-sm"
                                                                    />
                                                                ) : (
                                                                    <div className="w-16 h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                                                                        <span className="text-xl font-bold text-gray-400">
                                                                            {app.full_name.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-gray-900">{app.full_name}</p>
                                                                <p className="text-sm text-gray-600">🏢 {app.company || 'Tidak ada instansi'}</p>
                                                                <p className="text-xs text-gray-500 flex gap-4 mt-1">
                                                                    <span>📱 {app.whatsapp_number || '-'}</span>
                                                                    <span>📅 Diajukan: {new Date(app.created_at).toLocaleDateString('id-ID')}</span>
                                                                </p>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="w-full sm:w-auto mt-4 sm:mt-0 flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        if (isExpanded) {
                                                                            setApprovalModalApp(null)
                                                                        } else {
                                                                            setEditFormData({
                                                                                fullName: app.full_name,
                                                                                company: app.company || '',
                                                                                professionalCompetency: app.professional_competency || '',
                                                                                city: app.city || '',
                                                                                whatsappNumber: app.whatsapp_number || '',
                                                                                photoUrl: app.photo_url,
                                                                                assignedNumberId: '' // Explicitly unassigned initially
                                                                            })
                                                                            setApprovalModalApp(app)
                                                                            setShowRejectInput(false)
                                                                            setRejectionReason('')
                                                                        }
                                                                    }}
                                                                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-2 ${isExpanded
                                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                                                                        }`}
                                                                >
                                                                    {isExpanded ? 'Batal Tinjau' : 'Tinjau & Setujui'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expandable Inline Form */}
                                                        {isExpanded && (
                                                            <div className="border-t border-orange-100 bg-orange-50/10 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                    {/* Left Col - Visual KTA Preview */}
                                                                    <div className="hidden lg:flex flex-col items-center justify-start space-y-4">
                                                                        <h4 className="text-sm font-semibold text-gray-700 w-full text-center">Preview KTA</h4>
                                                                        <div className="relative sticky top-0 border border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white" style={{
                                                                            width: PREVIEW_WIDTH,
                                                                            height: PREVIEW_HEIGHT
                                                                        }}>
                                                                            {templateImageUrl ? (
                                                                                <>
                                                                                    <Image src={templateImageUrl} alt="KTA Template" fill className="object-cover" />

                                                                                    {/* Text Overlays - Name */}
                                                                                    <div className="absolute font-bold whitespace-nowrap overflow-hidden text-ellipsis flex items-center p-1" style={{
                                                                                        top: `${(fieldPositions.name.y / 312) * 100}%`,
                                                                                        left: `${(fieldPositions.name.x / 496) * 100}%`,
                                                                                        width: `${(fieldPositions.name.width / 496) * 100}%`,
                                                                                        height: `${(fieldPositions.name.height / 312) * 100}%`,
                                                                                        color: fieldPositions.name.fontColor,
                                                                                        fontSize: `${fieldPositions.name.fontSize}px`,
                                                                                        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
                                                                                    }}>
                                                                                        {editFormData.fullName || '-- NAMA LENGKAP --'}
                                                                                    </div>

                                                                                    {/* Text Overlays - KTA Number */}
                                                                                    <div className="absolute whitespace-nowrap overflow-hidden text-ellipsis flex items-center p-1" style={{
                                                                                        top: `${(fieldPositions.kta_number.y / 312) * 100}%`,
                                                                                        left: `${(fieldPositions.kta_number.x / 496) * 100}%`,
                                                                                        width: `${(fieldPositions.kta_number.width / 496) * 100}%`,
                                                                                        height: `${(fieldPositions.kta_number.height / 312) * 100}%`,
                                                                                        color: fieldPositions.kta_number.fontColor,
                                                                                        fontSize: `${fieldPositions.kta_number.fontSize}px`,
                                                                                        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
                                                                                    }}>
                                                                                        {(() => {
                                                                                            const numId = editFormData.assignedNumberId;
                                                                                            if (numId) {
                                                                                                const num = numbersList.find(n => n.id === numId);
                                                                                                return num ? num.kta_number : '1234.5678.9012';
                                                                                            }
                                                                                            return approvalModalApp?.kta_numbers?.kta_number || '1234.5678.9012';
                                                                                        })()}
                                                                                    </div>

                                                                                    {/* Photo Overlay */}
                                                                                    <div className="absolute bg-gray-200 overflow-hidden rounded-[8px]" style={{
                                                                                        top: `${(fieldPositions.photo.y / 312) * 100}%`,
                                                                                        left: `${(fieldPositions.photo.x / 496) * 100}%`,
                                                                                        width: `${(fieldPositions.photo.width / 496) * 100}%`,
                                                                                        height: `${(fieldPositions.photo.height / 312) * 100}%`
                                                                                    }}>
                                                                                        {editFormData.photoUrl ? (
                                                                                            <Image src={editFormData.photoUrl} alt="Photo" fill className="object-cover" />
                                                                                        ) : (
                                                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                                                                                                FOTO
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* QRCode */}
                                                                                    <div className="absolute bg-white flex items-center justify-center p-1 shadow-sm" style={{
                                                                                        top: `${(fieldPositions.qrcode.y / 312) * 100}%`,
                                                                                        left: `${(fieldPositions.qrcode.x / 496) * 100}%`,
                                                                                        width: `${(fieldPositions.qrcode.width / 496) * 100}%`,
                                                                                        height: `${(fieldPositions.qrcode.height / 312) * 100}%`
                                                                                    }}>
                                                                                        <div className="w-full h-full bg-white flex items-center justify-center p-1 border border-gray-100">
                                                                                            <ReactQRCode
                                                                                                value={`https://official.id/o/${org?.slug || 'preview'}/verify/preview-123`}
                                                                                                size={256}
                                                                                                style={{ width: '100%', height: '100%' }}
                                                                                                viewBox={`0 0 256 256`}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50">
                                                                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                                    <span className="text-sm">Template belum diatur</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 text-center max-w-sm mt-3 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm">
                                                                            Ini adalah perkiraan hasil gambar dari KTA yang akan diterbitkan
                                                                        </p>
                                                                    </div>

                                                                    {/* Right Col - Edit Fields */}
                                                                    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1">
                                                                        <h4 className="text-sm font-semibold text-gray-700 border-b pb-2 mb-4">Edit Data KTA</h4>
                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Foto KTA</label>
                                                                            <div className="flex items-start gap-4">
                                                                                <div className="relative w-24 h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                                                                                    {editFormData.photoUrl ? (
                                                                                        <Image src={editFormData.photoUrl} alt="Photo" fill className="object-cover" />
                                                                                    ) : (
                                                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <input
                                                                                        type="url"
                                                                                        value={editFormData.photoUrl || ''}
                                                                                        onChange={e => setEditFormData({ ...editFormData, photoUrl: e.target.value })}
                                                                                        placeholder="URL Foto (https://...)"
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                                                    />
                                                                                    <p className="text-xs text-gray-500 mt-2">Untuk mengganti foto, tempel URL foto baru di sini</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap di KTA</label>
                                                                            <input
                                                                                type="text"
                                                                                value={editFormData.fullName || ''}
                                                                                onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Nomor KTA (Opsional)</label>
                                                                            <select
                                                                                value={editFormData.assignedNumberId || ''}
                                                                                onChange={e => setEditFormData({ ...editFormData, assignedNumberId: e.target.value })}
                                                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                                                                            >
                                                                                <option value="">-- Otomatis Pilih Nomor Terkecil --</option>
                                                                                {numbersList.filter(n => !n.is_used).map(num => (
                                                                                    <option key={num.id} value={num.id}>{num.kta_number}</option>
                                                                                ))}
                                                                            </select>
                                                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                                Kosongkan untuk menggunakan nomor urut selanjutnya
                                                                            </p>
                                                                        </div>

                                                                        {/* Other Data */}
                                                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Instansi / Profesi</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editFormData.company || ''}
                                                                                    onChange={e => setEditFormData({ ...editFormData, company: e.target.value })}
                                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Kompetensi</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editFormData.professionalCompetency || ''}
                                                                                    onChange={e => setEditFormData({ ...editFormData, professionalCompetency: e.target.value })}
                                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Kota</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editFormData.city || ''}
                                                                                    onChange={e => setEditFormData({ ...editFormData, city: e.target.value })}
                                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editFormData.whatsappNumber || ''}
                                                                                    onChange={e => setEditFormData({ ...editFormData, whatsappNumber: e.target.value })}
                                                                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Buttons inside Editor */}
                                                                        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col gap-4">
                                                                            {showRejectInput ? (
                                                                                <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-100">
                                                                                    <label className="block text-sm font-medium text-red-700">Alasan Penolakan / Pembatalan</label>
                                                                                    <textarea
                                                                                        value={rejectionReason}
                                                                                        onChange={e => setRejectionReason(e.target.value)}
                                                                                        placeholder="Pesan ini akan dikirim ke email anggota..."
                                                                                        rows={3}
                                                                                        className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none bg-white"
                                                                                    />
                                                                                    <div className="flex justify-end gap-2 mt-2">
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setShowRejectInput(false)
                                                                                                setRejectionReason('')
                                                                                            }}
                                                                                            disabled={isRejecting}
                                                                                            className="px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                                                        >
                                                                                            Batal
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={handleReject}
                                                                                            disabled={isRejecting || !rejectionReason.trim()}
                                                                                            className="px-4 py-1.5 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
                                                                                        >
                                                                                            {isRejecting ? 'Memproses...' : 'Kirim Penolakan'}
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center justify-between">
                                                                                    <button
                                                                                        onClick={() => setShowRejectInput(true)}
                                                                                        disabled={validatingApproval}
                                                                                        className="px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                                                                                    >
                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                                        Tolak / Batalkan
                                                                                    </button>

                                                                                    <button
                                                                                        onClick={handleApprove}
                                                                                        disabled={validatingApproval || isRejecting || !editFormData.fullName || !editFormData.photoUrl}
                                                                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
                                                                                    >
                                                                                        {validatingApproval ? (
                                                                                            <>
                                                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                                                                {generatingAppId ? 'Merender KTA...' : 'Memproses...'}
                                                                                            </>
                                                                                        ) : (
                                                                                            <>
                                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                                                Setujui & Terbitkan KTA
                                                                                            </>
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
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

                                                        {app.gdrive_image_url && (
                                                            <button
                                                                onClick={() => handleDownload('image', app.id, app.full_name)}
                                                                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                                title="Buka File Gambar"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                File Gambar
                                                            </button>
                                                        )}

                                                        {app.gdrive_pdf_url && (
                                                            <button
                                                                onClick={() => handleDownload('pdf', app.id, app.full_name)}
                                                                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5"
                                                                title="Buka File PDF"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                File PDF
                                                            </button>
                                                        )}

                                                        {app.status === 'GENERATED' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAppForEdit(app)
                                                                    setEditGeneratedData({
                                                                        fullName: app.full_name,
                                                                        company: app.company || '',
                                                                        professionalCompetency: app.professional_competency || '',
                                                                        city: app.city || '',
                                                                        whatsappNumber: app.whatsapp_number || '',
                                                                        photoUrl: app.photo_url
                                                                    })
                                                                    setIsEditGeneratedModalOpen(true)
                                                                }}
                                                                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-200"
                                                                title="Edit Data KTA"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                Edit
                                                            </button>
                                                        )}

                                                        {app.status === 'GENERATED' && (
                                                            <button
                                                                onClick={() => {
                                                                    if (!template) {
                                                                        toast.error('Template tidak ditemukan.')
                                                                        return
                                                                    }
                                                                    setSelectedAppForRegenerate(app)
                                                                    setIsRegenerateModalOpen(true)
                                                                }}
                                                                disabled={regeneratingAppId === app.id}
                                                                className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                                                title="Regenerate KTA"
                                                            >
                                                                {regeneratingAppId === app.id ? (
                                                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-orange-700"></div>
                                                                ) : (
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                                )}
                                                                Regenerate
                                                            </button>
                                                        )}

                                                        {app.status === 'GENERATED' && (
                                                            <button
                                                                onClick={() => {
                                                                    setPromptModal({
                                                                        isOpen: true,
                                                                        title: 'Batalkan KTA',
                                                                        message: 'Masukkan alasan pembatalan KTA ini:',
                                                                        onConfirm: async (reason: string) => {
                                                                            setPromptModal(prev => ({ ...prev, isLoading: true }))
                                                                            try {
                                                                                const success = await rejectKTA(app.id, reason)
                                                                                if (success) {
                                                                                    toast.success('KTA Berhasil Dibatalkan.')
                                                                                    loadData()
                                                                                    setPromptModal(prev => ({ ...prev, isOpen: false }))
                                                                                }
                                                                            } catch (err: any) {
                                                                                toast.error('Terjadi kesalahan: ' + err.message)
                                                                                setPromptModal(prev => ({ ...prev, isLoading: false }))
                                                                            }
                                                                        }
                                                                    })
                                                                }}
                                                                disabled={isRejecting}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Batalkan KTA"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
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

                    {/* Approval UI has been moved inline within the pending tab */}

                    <BottomNavigation variant="organizations" />

                    {/* Regenerate Confirmation Modal */}
                    {isRegenerateModalOpen && selectedAppForRegenerate && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">Konfirmasi Regenerate</h3>
                                    <button
                                        onClick={() => {
                                            setIsRegenerateModalOpen(false)
                                            setSelectedAppForRegenerate(null)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        disabled={regeneratingAppId !== null}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 leading-tight">Regenerate KTA {selectedAppForRegenerate.full_name}?</h4>
                                            <p className="text-sm text-gray-500 mt-1">Penguraian gambar akan dilakukan di browser Anda lalu otomatis di-upload ke sistem (Cloudinary).</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-wrap sm:flex-nowrap">
                                    <button
                                        onClick={() => {
                                            setIsRegenerateModalOpen(false)
                                            setSelectedAppForRegenerate(null)
                                        }}
                                        disabled={regeneratingAppId !== null}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setRegeneratingAppId(selectedAppForRegenerate.id)
                                            // Reset editFormData to prevent stale data from previous approvals
                                            setEditFormData({})
                                            try {
                                                // Fetch FRESH data from DB in parallel: application + template
                                                const supabaseClient = createSupabaseClient()
                                                const [{ data: freshApp }, { data: freshTemplate }] = await Promise.all([
                                                    supabaseClient
                                                        .from('kta_applications')
                                                        .select('*')
                                                        .eq('id', selectedAppForRegenerate.id)
                                                        .single(),
                                                    supabaseClient
                                                        .from('kta_templates')
                                                        .select('*')
                                                        .eq('organization_id', orgId)
                                                        .single()
                                                ])

                                                const freshAppData = freshApp as any
                                                const freshName: string | undefined = freshAppData?.full_name || undefined
                                                const freshPhoto: string | undefined = freshAppData?.photo_url || undefined

                                                // Update template in state so KTACardGenerator uses the latest design
                                                if (freshTemplate) {
                                                    setTemplate(freshTemplate as any)
                                                    // Extra wait to let the template re-render in the offscreen KTACardGenerator
                                                    await new Promise(r => setTimeout(r, 300))
                                                }

                                                // Render client-side using ONLY fresh DB data, ignoring any stale editFormData
                                                const freshAppForGenerator = freshAppData || selectedAppForRegenerate
                                                const files = await generateClientFiles(
                                                    freshAppForGenerator,
                                                    selectedAppForRegenerate.kta_numbers?.kta_number!,
                                                    {
                                                        fullName: freshName,
                                                        photoUrl: freshPhoto,
                                                    },
                                                    true // ignoreEditForm: bypass all stale editFormData
                                                )
                                                if (!files) {
                                                    toast.error("Gagal merender file KTA pada browser Anda.")
                                                    setRegeneratingAppId(null)
                                                    return
                                                }

                                                const success = await regenerateKTA(selectedAppForRegenerate.id, files.base64Image, files.base64Pdf)
                                                if (success) {
                                                    toast.success('KTA Berhasil di-regenerate!')
                                                    loadData()
                                                    setIsRegenerateModalOpen(false)
                                                    setSelectedAppForRegenerate(null)
                                                }
                                            } catch (err: any) {
                                                toast.error('Terjadi kesalahan: ' + err.message)
                                            } finally {
                                                setRegeneratingAppId(null)
                                                setGeneratorUserData(null)
                                            }
                                        }}
                                        disabled={regeneratingAppId !== null}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {regeneratingAppId === selectedAppForRegenerate.id ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Memproses...</span>
                                            </>
                                        ) : (
                                            <span>Ya, Regenerate</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Generated KTA Modal */}
                    {isEditGeneratedModalOpen && selectedAppForEdit && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">Edit Data KTA</h3>
                                    <button
                                        onClick={() => {
                                            setIsEditGeneratedModalOpen(false)
                                            setSelectedAppForEdit(null)
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="p-6 overflow-y-auto space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p><strong>Penting:</strong> Setelah mengubah data, Anda harus melakukan <strong>Regenerate</strong> pada KTA ini agar perubahan data tercetak di file PDF & Gambar.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Foto KTA</label>
                                        <div className="flex flex-col sm:flex-row items-start gap-4">
                                            <div className="relative w-24 h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                                                {editGeneratedData.photoUrl ? (
                                                    <Image src={editGeneratedData.photoUrl} alt="Photo" fill className="object-cover" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 w-full">
                                                <input
                                                    type="url"
                                                    value={editGeneratedData.photoUrl || ''}
                                                    onChange={e => setEditGeneratedData({ ...editGeneratedData, photoUrl: e.target.value })}
                                                    placeholder="URL Foto (https://...)"
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">Ubah foto dengan menempel paste URL foto baru.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                value={editGeneratedData.fullName || ''}
                                                onChange={e => setEditGeneratedData({ ...editGeneratedData, fullName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instansi / Pekerjaan</label>
                                            <input
                                                type="text"
                                                value={editGeneratedData.company || ''}
                                                onChange={e => setEditGeneratedData({ ...editGeneratedData, company: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kompetensi Profesi</label>
                                            <input
                                                type="text"
                                                value={editGeneratedData.professionalCompetency || ''}
                                                onChange={e => setEditGeneratedData({ ...editGeneratedData, professionalCompetency: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Kota Asal</label>
                                            <input
                                                type="text"
                                                value={editGeneratedData.city || ''}
                                                onChange={e => setEditGeneratedData({ ...editGeneratedData, city: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">No WhatsApp</label>
                                            <input
                                                type="text"
                                                value={editGeneratedData.whatsappNumber || ''}
                                                onChange={e => setEditGeneratedData({ ...editGeneratedData, whatsappNumber: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-wrap sm:flex-nowrap border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            setIsEditGeneratedModalOpen(false)
                                            setSelectedAppForEdit(null)
                                        }}
                                        disabled={isUpdatingData}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleUpdateGeneratedData}
                                        disabled={isUpdatingData || !editGeneratedData.fullName || !editGeneratedData.photoUrl}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isUpdatingData ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Menyimpan...</span>
                                            </>
                                        ) : (
                                            <span>Simpan Perubahan</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden Offline KTA Generator DOM */}
                    {template && (
                        <KTACardGenerator
                            ref={ktaGeneratorRef}
                            templateUrl={template.template_image_url}
                            fieldPositions={template.field_positions as any}
                            userData={generatorUserData || { fullName: '', ktaNumber: '', photoUrl: '', qrCodeDataUrl: '' }}
                        />
                    )}

                    <ConfirmModal
                        isOpen={confirmModal.isOpen}
                        title={confirmModal.title}
                        message={confirmModal.message}
                        isDestructive={confirmModal.isDestructive}
                        isLoading={'isLoading' in confirmModal ? (confirmModal as any).isLoading : false}
                        onConfirm={confirmModal.onConfirm}
                        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    />

                    <PromptModal
                        isOpen={promptModal.isOpen}
                        title={promptModal.title}
                        message={promptModal.message}
                        isLoading={'isLoading' in promptModal ? (promptModal as any).isLoading : false}
                        confirmText={'Batalkan'}
                        inputType="textarea"
                        placeholder="Tuliskan alasan..."
                        onConfirm={promptModal.onConfirm}
                        onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
                    />
                </>
            )}
        </div>
    )
}
