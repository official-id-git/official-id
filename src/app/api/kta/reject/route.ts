import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
        const { applicationId, rejectionReason } = body

        if (!applicationId || !rejectionReason) {
            return NextResponse.json(
                { success: false, error: 'applicationId and rejectionReason are required' },
                { status: 400 }
            )
        }

        // 1. Fetch Application & Verify Permissions
        const { data: application } = await adminSupabase
            .from('kta_applications')
            .select('*')
            .eq('id', applicationId)
            .single()

        if (!application) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
        }

        const organizationId = application.organization_id

        // Ensure current user is an admin of this circle
        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json({ success: false, error: 'You are not authorized to perform this action' }, { status: 403 })
        }

        if (application.status === 'FAILED') {
            return NextResponse.json({ success: false, error: 'Application is already rejected/canceled' }, { status: 400 })
        }

        // 2. Free up assigned KTA Number if it was set
        if (application.kta_number_id) {
            await adminSupabase
                .from('kta_numbers')
                .update({ is_used: false, assigned_to: null })
                .eq('id', application.kta_number_id)
        }

        // 3. Update Application Status
        const { data: updatedApp, error: updateError } = await adminSupabase
            .from('kta_applications')
            .update({
                status: 'FAILED',
                rejection_reason: rejectionReason,
                kta_number_id: null, // Clear number
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .select()
            .single()

        if (updateError) throw updateError

        // 4. Send Email Notification
        try {
            const { sendEmail, getKtaRejectedEmailTemplate } = await import('@/lib/email')

            // Get user email & organization name
            const { data: userData } = await adminSupabase
                .from('users')
                .select('email')
                .eq('id', application.user_id)
                .single()

            const { data: orgData } = await adminSupabase
                .from('organizations')
                .select('name')
                .eq('id', organizationId)
                .single()

            if (userData?.email && orgData) {
                const rejectedEmailTemplate = getKtaRejectedEmailTemplate({
                    memberName: application.full_name,
                    organizationName: orgData.name,
                    rejectionReason: rejectionReason,
                    recipientEmail: userData.email,
                })

                await sendEmail({
                    to: userData.email,
                    subject: rejectedEmailTemplate.subject,
                    html: rejectedEmailTemplate.html,
                })
            }
        } catch (emailErr) {
            console.error('Failed to send KTA Rejection email:', emailErr)
        }

        return NextResponse.json({
            success: true,
            data: updatedApp
        })
    } catch (error: any) {
        console.error('POST /api/kta/reject error:', error)
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
        .select('is_admin, role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .single()

    if (member?.is_admin || member?.role === 'ADMIN' || member?.role === 'OWNER') return true

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    return userData?.role === 'APP_ADMIN'
}
