// KTA Template API Route
// POST: Save/update template config
// GET: Fetch template config for a circle

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'organizationId is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient() as any

        const { data, error } = await supabase
            .from('kta_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('GET /api/kta/template error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { organizationId, templateImageUrl, fieldPositions } = body

        if (!organizationId || !templateImageUrl) {
            return NextResponse.json(
                { success: false, error: 'organizationId and templateImageUrl are required' },
                { status: 400 }
            )
        }

        // Verify user is admin of this circle
        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Only circle admins can manage templates' },
                { status: 403 }
            )
        }

        // Upsert template (one per circle)
        const { data, error } = await adminSupabase
            .from('kta_templates')
            .upsert({
                organization_id: organizationId,
                template_image_url: templateImageUrl,
                field_positions: fieldPositions || getDefaultFieldPositions(),
                created_by: user.id,
            }, {
                onConflict: 'organization_id',
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('POST /api/kta/template error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

async function checkCircleAdmin(supabase: any, organizationId: string, userId: string): Promise<boolean> {
    // Check if user is owner
    const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single()

    if (org?.owner_id === userId) return true

    // Check if user is admin member
    const { data: member } = await supabase
        .from('organization_members')
        .select('is_admin')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .single()

    if (member?.is_admin) return true

    // Check if APP_ADMIN
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    return userData?.role === 'APP_ADMIN'
}

function getDefaultFieldPositions() {
    return {
        name: { x: 20, y: 120, width: 180, height: 30, fontSize: 14, fontColor: '#000000' },
        kta_number: { x: 20, y: 155, width: 180, height: 20, fontSize: 11, fontColor: '#333333' },
        photo: { x: 290, y: 40, width: 80, height: 100 },
        qrcode: { x: 295, y: 155, width: 60, height: 60 },
    }
}
