import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateNgabsenSchema } from '@/lib/validations/ngabsen'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/ngabsen/[id] - Get single ngabsen event with registrations
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch ngabsen with links and registrations
        const { data: ngabsen, error } = await (supabase as any)
            .from('ngabsen')
            .select(`
        *,
        link_ngabsen (
          link_pendaftaran,
          link_daftar_peserta
        ),
        pendaftaran_ngabsen (
          id,
          nama_peserta,
          deskripsi,
          email,
          no_whatsapp,
          created_at
        )
      `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (error || !ngabsen) {
            return NextResponse.json(
                { success: false, error: 'Acara tidak ditemukan' },
                { status: 404 }
            )
        }

        // Sort registrations by created_at descending
        if (ngabsen.pendaftaran_ngabsen) {
            ngabsen.pendaftaran_ngabsen.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
        }

        return NextResponse.json({ success: true, data: ngabsen })
    } catch (error) {
        console.error('Ngabsen GET [id] error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/ngabsen/[id] - Update ngabsen event
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Parse and validate input
        const body = await request.json()
        const validationResult = updateNgabsenSchema.safeParse(body)

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

        // Update ngabsen (RLS will check ownership)
        const { data, error } = await (supabase as any)
            .from('ngabsen')
            .update(validationResult.data)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error || !data) {
            console.error('Error updating ngabsen:', error)
            return NextResponse.json(
                { success: false, error: 'Gagal mengupdate acara atau acara tidak ditemukan' },
                { status: error ? 500 : 404 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Ngabsen PUT error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// DELETE /api/ngabsen/[id] - Delete ngabsen event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Delete ngabsen (cascades to links and registrations)
        const { error } = await (supabase as any)
            .from('ngabsen')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error deleting ngabsen:', error)
            return NextResponse.json(
                { success: false, error: 'Gagal menghapus acara' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, message: 'Acara berhasil dihapus' })
    } catch (error) {
        console.error('Ngabsen DELETE error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
