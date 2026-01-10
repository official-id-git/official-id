import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/templates/verify-pin - Verify PIN for a template
export async function POST(request: NextRequest) {
    try {
        const { templateId, pin } = await request.json()

        if (!templateId || !pin) {
            return NextResponse.json(
                { success: false, valid: false, error: 'Template ID and PIN are required' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Fetch the template with its PIN
        const { data, error } = await supabase
            .from('template_settings')
            .select('pin_code')
            .eq('template_id', templateId)
            .eq('access_type', 'pin')
            .single()

        if (error || !data) {
            return NextResponse.json(
                { success: false, valid: false, error: 'Template not found or not PIN-protected' },
                { status: 404 }
            )
        }

        // Compare PIN
        const isValid = data.pin_code === pin

        return NextResponse.json({
            success: true,
            valid: isValid,
            message: isValid ? 'PIN valid' : 'PIN tidak valid'
        })
    } catch (error) {
        console.error('PIN verification error:', error)
        return NextResponse.json(
            { success: false, valid: false, error: 'Internal server error' },
            { status: 500 }
        )
    }
}
