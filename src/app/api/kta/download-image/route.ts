import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url)
        const applicationId = url.searchParams.get('applicationId')

        if (!applicationId) {
            return new NextResponse('Application ID is required', { status: 400 })
        }

        const supabase = await createClient() as any
        const { data: { user } } = await supabase.auth.getUser()

        // 1. Fetch the application to get the Image URL
        const { data: application } = await supabase
            .from('kta_applications')
            .select('gdrive_image_url, user_id, organization_id, kta_numbers(kta_number), full_name')
            .eq('id', applicationId)
            .single()

        if (!application) {
            return new NextResponse('KTA Application not found', { status: 404 })
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
