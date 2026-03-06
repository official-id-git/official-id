// KTA Profile API Route
// GET: Fetch user profile + business card for KTA form auto-fill

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient() as any

        // Check auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        // Only allow fetching own profile
        if (userId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            )
        }

        // Fetch user profile with extended fields
        const { data: profile } = await supabase
            .from('users')
            .select('full_name, email, phone, company, city, avatar_url, birth_place, birth_date, province, professional_competency')
            .eq('id', userId)
            .single()

        // Fetch primary business card (most recent)
        const { data: cards } = await supabase
            .from('business_cards')
            .select('full_name, company, job_title, phone, city, profile_photo_url, email')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)

        const businessCard = cards && cards.length > 0 ? cards[0] : null

        return NextResponse.json({
            success: true,
            data: {
                profile: profile || {},
                businessCard: businessCard || {},
            }
        })
    } catch (error: any) {
        console.error('GET /api/kta/profile error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
