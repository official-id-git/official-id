'use client'

import { useState, useCallback } from 'react'

export interface KTATemplate {
    id: string
    organization_id: string
    template_image_url: string
    field_positions: {
        name: { x: number; y: number; width: number; height: number; fontSize?: number; fontColor?: string }
        kta_number: { x: number; y: number; width: number; height: number; fontSize?: number; fontColor?: string }
        photo: { x: number; y: number; width: number; height: number }
        qrcode: { x: number; y: number; width: number; height: number }
    }
    created_by: string
    created_at: string
    updated_at: string
}

export interface KTANumberStats {
    total: number
    used: number
    available: number
}

export interface KTAApplication {
    id: string
    organization_id: string
    user_id: string
    kta_number_id: string | null
    full_name: string
    company: string | null
    birth_place: string | null
    birth_date: string | null
    professional_competency: string | null
    photo_url: string
    city: string | null
    province: string | null
    whatsapp_number: string | null
    status: 'PENDING' | 'GENERATED' | 'FAILED'
    generated_card_url: string | null
    gdrive_file_id: string | null
    gdrive_pdf_url: string | null
    verification_token: string
    created_at: string
    updated_at: string
    kta_numbers?: { kta_number: string }
    users?: { full_name: string; email: string; avatar_url: string | null }
}

export function useKTA() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch template for a circle
    const fetchTemplate = useCallback(async (organizationId: string): Promise<KTATemplate | null> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/kta/template?organizationId=${organizationId}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Save/update template
    const saveTemplate = useCallback(async (
        organizationId: string,
        templateImageUrl: string,
        fieldPositions: KTATemplate['field_positions']
    ): Promise<KTATemplate | null> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/kta/template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId, templateImageUrl, fieldPositions }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Upload KTA numbers from Excel
    const uploadNumbers = useCallback(async (
        organizationId: string,
        file: File
    ): Promise<{ uploaded: number; total: number; duplicatesSkipped: number } | null> => {
        try {
            setLoading(true)
            setError(null)
            const formData = new FormData()
            formData.append('organizationId', organizationId)
            formData.append('file', file)

            const res = await fetch('/api/kta/numbers', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch KTA number stats
    const fetchNumberStats = useCallback(async (organizationId: string): Promise<{
        numbers: any[]
        stats: KTANumberStats
    } | null> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/kta/numbers?organizationId=${organizationId}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Delete unused KTA numbers
    const deleteUnusedNumbers = useCallback(async (organizationId: string): Promise<boolean> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/kta/numbers?organizationId=${organizationId}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        } finally {
            setLoading(false)
        }
    }, [])

    // Apply for KTA (member)
    const applyForKTA = useCallback(async (
        organizationId: string,
        formData: {
            fullName: string
            company?: string
            birthPlace?: string
            birthDate?: string
            professionalCompetency?: string
            photoUrl: string
            city?: string
            province?: string
            whatsappNumber?: string
        }
    ): Promise<KTAApplication | null> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/kta/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId, ...formData }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch my KTA for a circle
    const fetchMyKTA = useCallback(async (organizationId: string): Promise<KTAApplication | null> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/kta/applications?organizationId=${organizationId}&myOnly=true`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Fetch all KTA applications (admin)
    const fetchAllApplications = useCallback(async (organizationId: string): Promise<KTAApplication[]> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`/api/kta/applications?organizationId=${organizationId}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data || []
        } catch (err: any) {
            setError(err.message)
            return []
        } finally {
            setLoading(false)
        }
    }, [])

    // Approve KTA (admin)
    const approveKTA = useCallback(async (
        applicationId: string,
        assignedNumberId?: string,
        editedData?: any
    ): Promise<KTAApplication | null> => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/kta/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, assignedNumberId, editedData }),
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            return data.data
        } catch (err: any) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        error,
        fetchTemplate,
        saveTemplate,
        uploadNumbers,
        fetchNumberStats,
        deleteUnusedNumbers,
        applyForKTA,
        fetchMyKTA,
        fetchAllApplications,
        approveKTA,
    }
}
