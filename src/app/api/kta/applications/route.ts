// KTA Applications API Route
// GET: Admin fetches all KTA applications for a circle
// Also used by members to fetch their own KTA

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')
        const myOnly = searchParams.get('myOnly') === 'true'

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'organizationId is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        const { data: { user } } = await supabase.auth.getUser()

        if (myOnly && user) {
            // Fetch only the current user's KTA
            const { data, error } = await adminSupabase
                .from('kta_applications')
                .select(`
          *,
          kta_numbers(kta_number)
        `)
                .eq('organization_id', organizationId)
                .eq('user_id', user.id)
                .maybeSingle()

            if (error) throw error

            return NextResponse.json({ success: true, data })
        }

        // Admin: fetch all applications
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify admin
        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Only circle admins can view all applications' },
                { status: 403 }
            )
        }

        const { data, error } = await adminSupabase
            .from('kta_applications')
            .select(`
        *,
        kta_numbers(kta_number),
        users(full_name, email, avatar_url)
      `)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data: data || [] })
    } catch (error: any) {
        console.error('GET /api/kta/applications error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

async function checkCircleAdmin(supabase: any, organizationId: string, userId: string): Promise<boolean> {
    const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single()

    if (org?.owner_id === userId) return true

    const { data: member } = await supabase
        .from('organization_members')
        .select('is_admin')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .single()

    if (member?.is_admin) return true

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    return userData?.role === 'APP_ADMIN'
}
