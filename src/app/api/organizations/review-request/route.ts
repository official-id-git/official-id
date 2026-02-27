import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient() as any
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { requestId, status } = body

        if (!requestId || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload' },
                { status: 400 }
            )
        }

        // Get the request details and organization info
        const { data: orgRequest, error: reqError } = await supabase
            .from('organization_requests')
            .select('*, organizations(*)')
            .eq('id', requestId)
            .single()

        if (reqError || !orgRequest) {
            return NextResponse.json(
                { success: false, error: 'Request not found' },
                { status: 404 }
            )
        }

        // Check if the current user is an admin or owner of the organization
        const orgId = orgRequest.organization_id

        const isOwner = orgRequest.organizations.owner_id === user.id

        let isAdmin = false
        if (!isOwner) {
            const { data: membership } = await supabase
                .from('organization_members')
                .select('is_admin')
                .eq('organization_id', orgId)
                .eq('user_id', user.id)
                .eq('status', 'APPROVED')
                .single()

            isAdmin = membership?.is_admin || false
        }

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Forbidden. You do not have permission to manage this organization.' },
                { status: 403 }
            )
        }

        // Update the request status
        const { error: updateError } = await supabase
            .from('organization_requests')
            .update({
                status: status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id
            })
            .eq('id', requestId)

        if (updateError) {
            throw updateError
        }

        // If approved, check if the user already has an account with this email
        // and automatically add them to the organization if they do
        if (status === 'APPROVED') {
            const { data: targetUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', orgRequest.email)
                .single()

            if (targetUser) {
                // User exists, add them as member directly
                await supabase
                    .from('organization_members')
                    .insert({
                        organization_id: orgId,
                        user_id: targetUser.id,
                        status: 'APPROVED',
                        joined_at: new Date().toISOString()
                    })
                    // Handle case where they might somehow already be connected
                    .select()
            }
        }

        // Send email notification based on status
        try {
            const emailType = status === 'APPROVED' ? 'circle_request_approved' : 'circle_request_rejected'

            await fetch(new URL('/api/email/send', request.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: emailType,
                    data: {
                        recipientEmail: orgRequest.email,
                        organizationName: orgRequest.organizations.name,
                        organizationLogo: orgRequest.organizations.logo_url
                    }
                })
            })
        } catch (emailErr) {
            console.error('Failed to send status update email:', emailErr)
            // We don't fail the request if just the email fails
        }

        return NextResponse.json({ success: true, status })

    } catch (error: any) {
        console.error('Review request error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process the request' },
            { status: 500 }
        )
    }
}
