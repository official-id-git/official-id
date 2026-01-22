import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNgabsenSchema } from '@/lib/validations/ngabsen'

// Helper to generate unique slugs
function generateSlug(): string {
    // Generate a URL-safe random string
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// GET /api/ngabsen - Get all ngabsen events for current user
export async function GET() {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch ngabsen events with their links
        // Using type assertion since types are not yet regenerated
        const { data, error } = await (supabase as any)
            .from('ngabsen')
            .select(`
        *,
        link_ngabsen (
          link_pendaftaran,
          link_daftar_peserta
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching ngabsen:', error)
            return NextResponse.json(
                { success: false, error: 'Gagal mengambil data acara' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Ngabsen GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/ngabsen - Create new ngabsen event with links
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user is PAID_USER or APP_ADMIN
        const { data: userData, error: userError } = await (supabase as any)
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || !userData || !['PAID_USER', 'APP_ADMIN'].includes((userData as any).role)) {
            return NextResponse.json(
                { success: false, error: 'Hanya pengguna premium yang dapat membuat acara Ngabsen' },
                { status: 403 }
            )
        }

        // Parse and validate input
        const body = await request.json()
        const validationResult = createNgabsenSchema.safeParse(body)

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

        const { nama_acara, tempat_acara, tanggal_acara } = validationResult.data

        // Create ngabsen event using type assertion
        const { data: ngabsen, error: ngabsenError } = await (supabase as any)
            .from('ngabsen')
            .insert({
                user_id: user.id,
                nama_acara,
                tempat_acara,
                tanggal_acara
            })
            .select()
            .single()

        if (ngabsenError || !ngabsen) {
            console.error('Error creating ngabsen:', ngabsenError)
            return NextResponse.json(
                { success: false, error: 'Gagal membuat acara' },
                { status: 500 }
            )
        }

        // Generate unique links
        const linkPendaftaran = generateSlug()
        const linkDaftarPeserta = generateSlug()

        // Create link_ngabsen entry
        const { data: linkData, error: linkError } = await (supabase as any)
            .from('link_ngabsen')
            .insert({
                ngabsen_id: ngabsen.id,
                user_id: user.id,
                link_pendaftaran: linkPendaftaran,
                link_daftar_peserta: linkDaftarPeserta
            })
            .select()
            .single()

        if (linkError) {
            console.error('Error creating links:', linkError)
            // Rollback ngabsen creation
            await (supabase as any).from('ngabsen').delete().eq('id', ngabsen.id)
            return NextResponse.json(
                { success: false, error: 'Gagal membuat link' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                ...ngabsen,
                link_ngabsen: linkData
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Ngabsen POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
