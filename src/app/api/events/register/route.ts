import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, EMAIL_SENDERS, getEventRegistrationConfirmationTemplate } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { event_id, name, email, phone, institution, payment_proof_url } = body

        if (!event_id || !name || !email) {
            return NextResponse.json(
                { error: 'event_id, name, dan email wajib diisi' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Fetch event details
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*, organizations:organization_id(name, username)')
            .eq('id', event_id)
            .single()

        if (eventError || !event) {
            return NextResponse.json(
                { error: 'Event tidak ditemukan' },
                { status: 404 }
            )
        }

        // Check if already registered
        const { data: existing } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', event_id)
            .eq('email', email)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { error: 'Email ini sudah terdaftar untuk event ini' },
                { status: 409 }
            )
        }

        // Check max participants
        const { count } = await supabase
            .from('event_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', event_id)

        if (count !== null && count >= event.max_participants) {
            return NextResponse.json(
                { error: 'Kuota peserta sudah penuh' },
                { status: 400 }
            )
        }

        // Insert registration
        const { data: registration, error: regError } = await supabase
            .from('event_registrations')
            .insert({
                event_id,
                name,
                email,
                phone: phone || null,
                institution: institution || null,
                status: 'pending',
            })
            .select()
            .single()

        if (regError) {
            console.error('Registration error:', regError)
            return NextResponse.json(
                { error: 'Gagal mendaftar event' },
                { status: 500 }
            )
        }

        let paymentProofUrl: string | undefined

        // Save payment proof URL if provided (uploaded directly to Cloudinary by client)
        if (payment_proof_url) {
            paymentProofUrl = payment_proof_url
            try {
                const { error: proofError } = await supabase
                    .from('event_payment_proofs')
                    .insert({
                        registration_id: registration.id,
                        image_url: paymentProofUrl,
                    })

                if (proofError) {
                    console.error('Save payment proof to DB error:', proofError)
                } else {
                    console.log('Successfully saved payment proof to DB for registration_id:', registration.id)
                }
            } catch (err) {
                console.error('Payment proof save error:', err)
            }
        }

        // Send confirmation email
        const orgData = event.organizations as any
        const orgName = orgData?.name || 'Circle'
        const orgUsername = orgData?.username || ''
        const circleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'}/o/${orgUsername}`

        const emailTemplate = getEventRegistrationConfirmationTemplate({
            participantName: name,
            eventTitle: event.title,
            eventDate: event.event_date,
            eventTime: event.event_time,
            eventType: event.type,
            eventLocation: event.location || undefined,
            organizationName: orgName,
            circleUrl,
            paymentProofUrl,
        })

        await sendEmail({
            to: email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            from: EMAIL_SENDERS.circle,
        })

        // Progressively enrich user profile with phone and company
        // Only update fields that are currently empty in the user's profile
        if (phone || institution) {
            const { data: userProfile } = await supabase
                .from('users')
                .select('id, phone, company')
                .eq('email', email)
                .maybeSingle()

            if (userProfile) {
                const updates: Record<string, string> = {}
                if (phone && !userProfile.phone) updates.phone = phone
                if (institution && !userProfile.company) updates.company = institution

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('users')
                        .update(updates)
                        .eq('id', userProfile.id)
                }
            }
        }

        return NextResponse.json({
            success: true,
            registration,
            message: 'Pendaftaran berhasil! Email konfirmasi telah dikirim.',
        })
    } catch (error: any) {
        console.error('Event registration API error:', error)
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}
