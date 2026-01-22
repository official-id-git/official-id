import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimit'
import * as XLSX from 'xlsx'

interface RouteParams {
    params: Promise<{ linkId: string }>
}

// GET /api/ngabsen/public/export/[linkId] - Export attendee list to Excel
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { linkId } = await params

        // Rate limiting (use public view limit)
        const clientIP = getClientIP(request)
        const rateLimitResult = checkRateLimit(`ngabsen-export:${clientIP}`, RATE_LIMITS.PUBLIC_VIEW)

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
            .order('created_at', { ascending: true }) // Oldest first for numbering

        if (regError) {
            console.error('Error fetching registrations:', regError)
            return NextResponse.json(
                { success: false, error: 'Gagal mengambil data peserta' },
                { status: 500 }
            )
        }

        // Format data for Excel
        const acara = linkData.ngabsen
        const excelData = (registrations || []).map((reg: any, index: number) => ({
            'No': index + 1,
            'Nama Peserta': reg.nama_peserta,
            'Email': reg.email,
            'No WhatsApp': reg.no_whatsapp,
            'Deskripsi': reg.deskripsi || '-',
            'Waktu Daftar': new Date(reg.created_at).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short'
            })
        }))

        // Create workbook
        const workbook = XLSX.utils.book_new()

        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData)

        // Set column widths
        worksheet['!cols'] = [
            { wch: 5 },   // No
            { wch: 30 },  // Nama Peserta
            { wch: 30 },  // Email
            { wch: 18 },  // No WhatsApp
            { wch: 40 },  // Deskripsi
            { wch: 20 },  // Waktu Daftar
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Hadir')

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Create safe filename
        const safeFileName = (acara?.nama_acara || 'daftar-hadir')
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50)

        // Return Excel file
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${safeFileName}.xlsx"`,
                'Cache-Control': 'no-cache'
            }
        })

    } catch (error) {
        console.error('Export Excel error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
