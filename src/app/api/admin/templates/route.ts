import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/templates - Fetch all template settings with PINs (admin only)
export async function GET() {
    try {
        const supabase = await createClient() as any

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || !userData || userData.role !== 'APP_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Fetch all template settings including PIN
        const { data, error } = await supabase
            .from('template_settings')
            .select('*')
            .order('display_order', { ascending: true })

        if (error) {
            console.error('Error fetching template settings:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch template settings' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Admin template settings error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// PUT /api/admin/templates - Update template settings (admin only)
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient() as any

        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || userData?.role !== 'APP_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id, template_id, access_type, pin_code, is_active } = await request.json()

        if (!id && !template_id) {
            return NextResponse.json(
                { success: false, error: 'Template ID is required' },
                { status: 400 }
            )
        }

        // Build update object
        const updateData: Record<string, any> = {}
        if (access_type !== undefined) updateData.access_type = access_type
        if (pin_code !== undefined) updateData.pin_code = pin_code
        if (is_active !== undefined) updateData.is_active = is_active

        // If changing to non-pin type, clear the pin_code
        if (access_type && access_type !== 'pin') {
            updateData.pin_code = null
        }

        const query = id
            ? supabase.from('template_settings').update(updateData).eq('id', id)
            : supabase.from('template_settings').update(updateData).eq('template_id', template_id)

        const { data, error } = await query.select().single()

        if (error) {
            console.error('Error updating template settings:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to update template settings' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('Admin template update error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
