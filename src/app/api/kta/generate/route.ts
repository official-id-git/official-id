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
        const {
            organizationId,
            fullName,
            company,
            birthPlace,
            birthDate,
            professionalCompetency,
            photoUrl,
            city,
            province,
            whatsappNumber,
        } = body

        if (!organizationId || !fullName || !photoUrl) {
            return NextResponse.json(
                { success: false, error: 'organizationId, fullName, and photoUrl are required' },
                { status: 400 }
            )
        }

        // Verify user is approved member of this circle
        const { data: membership } = await supabase
            .from('organization_members')
            .select('status')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .eq('status', 'APPROVED')
            .single()

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'You must be an approved member of this circle' },
                { status: 403 }
            )
        }

        // Check if user already has a KTA for this circle
        const { data: existingKTA } = await adminSupabase
            .from('kta_applications')
            .select('id, status, gdrive_pdf_url, generated_card_url')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single()

        if (existingKTA && (existingKTA.status === 'GENERATED' || existingKTA.status === 'PENDING')) {
            return NextResponse.json(
                { success: false, error: 'You already have a KTA application processing or generated', data: existingKTA },
                { status: 400 }
            )
        }

        // Get organization info for emails
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('name, username')
            .eq('id', organizationId)
            .single()

        const circleName = org?.name || organizationId
        const circleUsername = org?.username || organizationId

        // Create verification token
        const verificationToken = crypto.randomUUID()

        // Save/update application record (Status PENDING)
        const applicationData = {
            organization_id: organizationId,
            user_id: user.id,
            kta_number_id: null, // Will be set upon approval
            full_name: fullName,
            company: company || null,
            birth_place: birthPlace || null,
            birth_date: birthDate || null,
            professional_competency: professionalCompetency || null,
            photo_url: photoUrl,
            city: city || null,
            province: province || null,
            whatsapp_number: whatsappNumber || null,
            status: 'PENDING',
            gdrive_file_id: null,
            gdrive_pdf_url: null,
            generated_card_url: null,
            verification_token: verificationToken,
        }

        let result
        if (existingKTA) {
            // Update existing application
            const { data, error } = await adminSupabase
                .from('kta_applications')
                .update(applicationData)
                .eq('id', existingKTA.id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else {
            // Insert new application
            const { data, error } = await adminSupabase
                .from('kta_applications')
                .insert(applicationData)
                .select()
                .single()
            if (error) throw error
            result = data
        }

        // Update user profile with the new data
        try {
            await adminSupabase
                .from('users')
                .update({
                    birth_place: birthPlace || undefined,
                    birth_date: birthDate || undefined,
                    province: province || undefined,
                    professional_competency: professionalCompetency || undefined,
                    phone: whatsappNumber || undefined,
                    company: company || undefined,
                })
                .eq('id', user.id)
        } catch (e) {
            console.warn('Could not update users table, columns might be missing:', e)
        }

        // Auto-create a primary digital business card if they don't have one
        const { data: existingCards } = await adminSupabase
            .from('business_cards')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

        if (!existingCards || existingCards.length === 0) {
            // Pick a default template to use for auto-creation
            const { data: defaultTemplate } = await adminSupabase
                .from('card_templates')
                .select('id')
                .eq('is_premium', false)
                .limit(1)
                .maybeSingle()

            await adminSupabase
                .from('business_cards')
                .insert({
                    user_id: user.id,
                    template_id: defaultTemplate?.id || null, // Will fall back to whatever default layout if not found
                    full_name: fullName,
                    company: company || '',
                    job_title: professionalCompetency || '',
                    phone: whatsappNumber || '',
                    city: city || '',
                    profile_photo_url: photoUrl,
                    email: user.email, // Best effort from their login profile
                })
        }

        // Send Email Notifications
        try {
            const { sendEmail } = await import('@/lib/email')
            const { getKTAPendingEmailTemplate, getKTAAdminNotificationTemplate } = await import('@/lib/email')

            // 1. Send PENDING email to Member
            const memberEmailTemplate = getKTAPendingEmailTemplate({
                memberName: fullName,
                organizationName: circleName,
                recipientEmail: user.email!,
            })

            await sendEmail({
                to: user.email!,
                subject: memberEmailTemplate.subject,
                html: memberEmailTemplate.html,
            })

            // 2. Fetch Circle Admins to send notification
            const { data: adminMembers } = await adminSupabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', organizationId)
                .in('role', ['OWNER', 'ADMIN'])

            if (adminMembers && adminMembers.length > 0) {
                const adminUserIds = adminMembers.map((m: any) => m.user_id)
                const { data: admins } = await adminSupabase
                    .from('users')
                    .select('email, full_name')
                    .in('id', adminUserIds)
                    .not('email', 'is', null)

                if (admins && admins.length > 0) {
                    for (const admin of admins) {
                        const adminNotification = getKTAAdminNotificationTemplate({
                            adminName: admin.full_name,
                            organizationName: circleName,
                            applicantName: fullName,
                            applicantEmail: user.email!,
                            circleUsername,
                        })
                        await sendEmail({
                            to: admin.email,
                            subject: adminNotification.subject,
                            html: adminNotification.html,
                        })
                    }
                }
            }
        } catch (emailError) {
            console.error('Failed to send KTA emails:', emailError)
            // Continue because the main DB transaction succeeded
        }

        return NextResponse.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('POST /api/kta/generate error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
