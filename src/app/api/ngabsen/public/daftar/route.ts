import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pendaftaranSchema } from '@/lib/validations/ngabsen'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimit'

// POST /api/ngabsen/public/daftar - Public registration (no auth required)
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`ngabsen-daftar:${clientIP}`, RATE_LIMITS.PUBLIC_FORM)

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.',
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

        // Parse and validate input
        const body = await request.json()
        const validationResult = pendaftaranSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validasi gagal',
                    details: validationResult.error.flatten().fieldErrors
                },
                { status: 400 }
            )
        }

        const { link_pendaftaran, nama_peserta, deskripsi, email, no_whatsapp } = validationResult.data

        // Create supabase client (use service role for public insert or anon with proper RLS)
        const supabase = await createClient()

        // Find the ngabsen by link_pendaftaran
        const { data: linkData, error: linkError } = await (supabase as any)
            .from('link_ngabsen')
            .select('ngabsen_id')
            .eq('link_pendaftaran', link_pendaftaran)
            .single()

        if (linkError || !linkData) {
            return NextResponse.json(
                { success: false, error: 'Link pendaftaran tidak valid atau tidak ditemukan' },
                { status: 404 }
            )
        }

        // Insert registration
        const { data: registration, error: regError } = await (supabase as any)
            .from('pendaftaran_ngabsen')
            .insert({
                ngabsen_id: linkData.ngabsen_id,
                nama_peserta,
                deskripsi: deskripsi || null,
                email,
                no_whatsapp
            })
            .select()
            .single()

        if (regError) {
            console.error('Error creating registration:', regError)
            return NextResponse.json(
                { success: false, error: 'Gagal mendaftar. Silakan coba lagi.' },
                { status: 500 }
            )
        }

        // Get the link_daftar_peserta for redirect
        const { data: fullLinkData } = await (supabase as any)
            .from('link_ngabsen')
            .select('link_daftar_peserta')
            .eq('link_pendaftaran', link_pendaftaran)
            .single()

        return NextResponse.json({
            success: true,
            data: registration,
            redirect: fullLinkData?.link_daftar_peserta || null
        }, { status: 201 })

    } catch (error) {
        console.error('Public registration error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
