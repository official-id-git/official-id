// KTA Verification API Route
// GET: Public endpoint to verify KTA by token

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params
        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Verification token is required' },
                { status: 400 }
            )
        }

        const adminSupabase = createAdminClient() as any

        // Fetch KTA application by verification token
        const { data: kta, error } = await adminSupabase
            .from('kta_applications')
            .select(`
        *,
        kta_numbers(kta_number),
        users(full_name, email, avatar_url),
        organizations(id, name, username, logo_url, description)
      `)
            .eq('verification_token', token)
            .eq('status', 'GENERATED')
            .single()

        if (error || !kta) {
            return NextResponse.json(
                { success: false, error: 'KTA not found or not yet generated' },
                { status: 404 }
            )
        }

        // Also fetch the user's business card for displaying alongside KTA
        const { data: businessCard } = await adminSupabase
            .from('business_cards')
            .select('*')
            .eq('user_id', kta.user_id)
            .eq('is_public', true)
            .limit(1)
            .maybeSingle()

        return NextResponse.json({
            success: true,
            data: {
                kta: {
                    id: kta.id,
                    fullName: kta.full_name,
                    company: kta.company,
                    ktaNumber: kta.kta_numbers?.kta_number,
                    photoUrl: kta.photo_url,
                    city: kta.city,
                    province: kta.province,
                    professionalCompetency: kta.professional_competency,
                    generatedCardUrl: kta.generated_card_url,
                    gdrivePdfUrl: kta.gdrive_pdf_url,
                    createdAt: kta.created_at,
                    status: kta.status,
                },
                organization: kta.organizations,
                user: {
                    fullName: kta.users?.full_name,
                    email: kta.users?.email,
                    avatarUrl: kta.users?.avatar_url,
                },
                businessCard: businessCard || null,
            }
        })
    } catch (error: any) {
        console.error('GET /api/kta/verify error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
