'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

// Types for ngabsen
export interface Ngabsen {
    id: string
    user_id: string
    nama_acara: string
    tempat_acara: string
    tanggal_acara: string
    created_at: string
    updated_at: string
    link_ngabsen?: {
        link_pendaftaran: string
        link_daftar_peserta: string
    }
    pendaftaran_ngabsen?: Pendaftaran[]
}

export interface Pendaftaran {
    id: string
    ngabsen_id: string
    nama_peserta: string
    deskripsi: string | null
    email: string
    no_whatsapp: string
    created_at: string
}

export interface CreateNgabsenData {
    nama_acara: string
    tempat_acara: string
    tanggal_acara: string
}

export interface UpdateNgabsenData {
    nama_acara?: string
    tempat_acara?: string
    tanggal_acara?: string
}

export function useNgabsen() {
    const { user } = useAuth()
    const [ngabsenList, setNgabsenList] = useState<Ngabsen[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check if user is pro
    const isPro = user?.role === 'PAID_USER' || user?.role === 'APP_ADMIN'

    // Fetch all ngabsen for current user
    const fetchNgabsen = useCallback(async () => {
        if (!user) return

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/ngabsen')
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Gagal mengambil data acara')
            }

            setNgabsenList(result.data || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }, [user])

    // Fetch single ngabsen with registrations
    const fetchNgabsenById = useCallback(async (id: string): Promise<Ngabsen | null> => {
        if (!user) return null

        try {
            const response = await fetch(`/api/ngabsen/${id}`)
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Acara tidak ditemukan')
            }

            return result.data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
            return null
        }
    }, [user])

    // Create new ngabsen
    const createNgabsen = useCallback(async (data: CreateNgabsenData): Promise<Ngabsen | null> => {
        if (!user || !isPro) {
            setError('Anda harus menjadi pengguna premium untuk membuat acara')
            return null
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/ngabsen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Gagal membuat acara')
            }

            // Add to list
            setNgabsenList(prev => [result.data, ...prev])
            return result.data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
            return null
        } finally {
            setLoading(false)
        }
    }, [user, isPro])

    // Update ngabsen
    const updateNgabsen = useCallback(async (id: string, data: UpdateNgabsenData): Promise<boolean> => {
        if (!user) return false

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/ngabsen/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Gagal mengupdate acara')
            }

            // Update in list
            setNgabsenList(prev =>
                prev.map(item => item.id === id ? { ...item, ...result.data } : item)
            )
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
            return false
        } finally {
            setLoading(false)
        }
    }, [user])

    // Delete ngabsen
    const deleteNgabsen = useCallback(async (id: string): Promise<boolean> => {
        if (!user) return false

        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/ngabsen/${id}`, {
                method: 'DELETE'
            })
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Gagal menghapus acara')
            }

            // Remove from list
            setNgabsenList(prev => prev.filter(item => item.id !== id))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
            return false
        } finally {
            setLoading(false)
        }
    }, [user])

    // Generate full URLs for links
    const getFullLinks = useCallback((ngabsen: Ngabsen) => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        return {
            pendaftaran: ngabsen.link_ngabsen
                ? `${baseUrl}/ngabsen/${ngabsen.link_ngabsen.link_pendaftaran}`
                : null,
            daftarPeserta: ngabsen.link_ngabsen
                ? `${baseUrl}/ngabsen/peserta/${ngabsen.link_ngabsen.link_daftar_peserta}`
                : null
        }
    }, [])

    // Load data on mount
    useEffect(() => {
        if (user && isPro) {
            fetchNgabsen()
        }
    }, [user, isPro, fetchNgabsen])

    return {
        ngabsenList,
        loading,
        error,
        isPro,
        fetchNgabsen,
        fetchNgabsenById,
        createNgabsen,
        updateNgabsen,
        deleteNgabsen,
        getFullLinks,
        clearError: () => setError(null)
    }
}

// Hook for public ngabsen data (no auth required)
export function usePublicNgabsen() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch public attendee list
    const fetchPeserta = useCallback(async (linkId: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/ngabsen/public/peserta/${linkId}`)
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Data tidak ditemukan')
            }

            return result.data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    // Submit public registration
    const submitPendaftaran = useCallback(async (data: {
        link_pendaftaran: string
        nama_peserta: string
        deskripsi?: string | null
        email: string
        no_whatsapp: string
    }) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/ngabsen/public/daftar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || 'Gagal mendaftar')
            }

            return result
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        error,
        fetchPeserta,
        submitPendaftaran,
        clearError: () => setError(null)
    }
}
