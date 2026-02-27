import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient() as any

        const body = await request.json()
        const { organizationId, email, message } = body

        if (!organizationId || !email) {
            return NextResponse.json(
                { success: false, error: 'Organization ID dan email diwajibkan' },
                { status: 400 }
            )
        }

        // Check if organization exists
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', organizationId)
            .single()

        if (orgError || !org) {
            return NextResponse.json(
                { success: false, error: 'Circle tidak ditemukan' },
                { status: 404 }
            )
        }

        // Check if the user is already a member
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            const { data: existingMember } = await supabase
                .from('organization_members')
                .select('id, status')
                .eq('organization_id', organizationId)
                .eq('user_id', existingUser.id)
                .single()

            if (existingMember) {
                if (existingMember.status === 'APPROVED') {
                    return NextResponse.json(
                        { success: false, error: 'Anda sudah menjadi anggota di Circle ini' },
                        { status: 400 }
                    )
                } else if (existingMember.status === 'PENDING') {
                    return NextResponse.json(
                        { success: false, error: 'Permintaan Anda sedang menunggu persetujuan admin' },
                        { status: 400 }
                    )
                }
            }
        }

        // Insert request
        const { data: requestResult, error: insertError } = await supabase
            .from('organization_requests')
            .insert({
                organization_id: organizationId,
                email,
                message: message || null,
                status: 'PENDING'
            })
            .select()
            .single()

        if (insertError) {
            // Handle unique constraint violation (duplicate pending request)
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { success: false, error: 'Anda sudah memiliki permintaan bergabung yang sedang menunggu persetujuan' },
                    { status: 400 }
                )
            }
            throw insertError
        }

        // Fetch admins to send notification emails
        const { data: admins } = await supabase
            .from('organization_members')
            .select('users(email, full_name)')
            .eq('organization_id', organizationId)
            .eq('status', 'APPROVED')
            .eq('is_admin', true)

        const { data: owner } = await supabase
            .from('organizations')
            .select('users!organizations_owner_id_fkey(email, full_name)')
            .eq('id', organizationId)
            .single()

        // Combine admins and owner
        const adminEmails = new Set<string>()
        const adminDetails: { email: string, name: string }[] = []

        if (owner?.users?.email) {
            adminEmails.add(owner.users.email)
            adminDetails.push({ email: owner.users.email, name: owner.users.full_name })
        }

        if (admins) {
            admins.forEach((admin: any) => {
                if (admin.users?.email && !adminEmails.has(admin.users.email)) {
                    adminEmails.add(admin.users.email)
                    adminDetails.push({ email: admin.users.email, name: admin.users.full_name })
                }
            })
        }

        // Send emails asynchronously (don't await)
        adminDetails.forEach(async (admin) => {
            try {
                // Call our internal email API
                await fetch(new URL('/api/email/send', request.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'circle_request_admin_notification',
                        data: {
                            recipientEmail: admin.email,
                            adminName: admin.name,
                            organizationName: org.name,
                            requesterEmail: email,
                            requesterMessage: message
                        }
                    })
                })
            } catch (err) {
                console.error('Failed to queue admin notification email:', err)
            }
        })

        return NextResponse.json({ success: true, request: requestResult })

    } catch (error: any) {
        console.error('Request join error:', error)
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan saat memproses permintaan bergabung' },
            { status: 500 }
        )
    }
}
