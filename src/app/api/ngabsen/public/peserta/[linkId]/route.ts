import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimit'

interface RouteParams {
    params: Promise<{ linkId: string }>
}

// GET /api/ngabsen/public/peserta/[linkId] - Get public attendee list
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { linkId } = await params

        // Rate limiting
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`ngabsen-peserta:${clientIP}`, RATE_LIMITS.PUBLIC_VIEW)

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Terlalu banyak permintaan. Silakan coba lagi.',
                    retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
                    }
                }
            )
        }

        const supabase = await createClient()

        // Find the ngabsen by link_daftar_peserta
        const { data: linkData, error: linkError } = await (supabase as any)
            .from('link_ngabsen')
            .select(`
        ngabsen_id,
        ngabsen:ngabsen_id (
          id,
          nama_acara,
          tempat_acara,
          tanggal_acara
        )
      `)
            .eq('link_daftar_peserta', linkId)
            .single()

        if (linkError || !linkData) {
            return NextResponse.json(
                { success: false, error: 'Link tidak valid atau tidak ditemukan' },
                { status: 404 }
            )
        }

        // Get registrations
        const { data: registrations, error: regError } = await (supabase as any)
            .from('pendaftaran_ngabsen')
            .select('id, nama_peserta, deskripsi, email, no_whatsapp, created_at')
            .eq('ngabsen_id', linkData.ngabsen_id)
            .order('created_at', { ascending: false })

        if (regError) {
            console.error('Error fetching registrations:', regError)
            return NextResponse.json(
                { success: false, error: 'Gagal mengambil data peserta' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                acara: linkData.ngabsen,
                peserta: registrations || [],
                total: registrations?.length || 0
            }
        })

    } catch (error) {
        console.error('Public peserta GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
