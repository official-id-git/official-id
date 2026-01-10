import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/templates - Fetch all template settings (public, excludes pin_code)
export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('template_settings')
            .select('id, template_id, template_name, access_type, is_active, display_order')
            .eq('is_active', true)
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
        console.error('Template settings error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
