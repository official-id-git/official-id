import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const applicationId = url.searchParams.get('applicationId')

        if (!applicationId) {
            return new NextResponse('Application ID is required', { status: 400 })
        }

        // Auth check with regular client
        const supabase = await createClient() as any
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Use admin client for DB query to bypass RLS (kta_numbers has admin-only SELECT policy)
        const adminSupabase = createAdminClient() as any

        // 1. Fetch the application to get the Image URL
        const { data: application } = await adminSupabase
            .from('kta_applications')
            .select('gdrive_image_url, user_id, organization_id, kta_numbers(kta_number), full_name')
            .eq('id', applicationId)
            .single()

        if (!application) {
            return new NextResponse('KTA Application not found', { status: 404 })
        }

        // Verify the requesting user owns this KTA or is admin
        if (application.user_id !== user.id) {
            const { data: membership } = await adminSupabase
                .from('organization_members')
                .select('is_admin, role')
                .eq('organization_id', application.organization_id)
                .eq('user_id', user.id)
                .eq('status', 'APPROVED')
                .single()

            const isAdmin = membership?.is_admin || membership?.role === 'ADMIN' || membership?.role === 'OWNER'
            if (!isAdmin) {
                return new NextResponse('Forbidden', { status: 403 })
            }
        }

        if (!application.gdrive_image_url) {
            return new NextResponse('KTA Image not generated yet', { status: 400 })
        }

        // 2. Fetch the actual PNG image from Cloudinary as a Buffer
        const imageRes = await fetch(application.gdrive_image_url)
        if (!imageRes.ok) {
            return new NextResponse('Failed to fetch source image from storage', { status: 500 })
        }

        const arrayBuffer = await imageRes.arrayBuffer()
        const imageBuffer = Buffer.from(arrayBuffer)

        // 3. Send back as a downloadable PNG stream
        const ktaNumber = application.kta_numbers?.kta_number || 'KTA'
        const safeName = application.full_name.replace(/[^a-zA-Z0-9]/g, '_')
        const filename = `${ktaNumber}_${safeName}_image.png`

        return new NextResponse(new Uint8Array(imageBuffer), {
            headers: {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        })

    } catch (error: any) {
        console.error('Error downloading KTA Image:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
