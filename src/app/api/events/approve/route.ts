import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendEmail, EMAIL_SENDERS, getEventApprovalTemplate } from '@/lib/email'

function generateTicketNumber(eventTitle: string, seqNum: number, eventDate: string): string {
    // 1. Get first 3 alphanumeric characters of title, uppercase
    const cleanTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, '')
    const eventCode = (cleanTitle.substring(0, 3) || 'EVT').toUpperCase().padEnd(3, 'X')

    // 2. Format sequence number to 4 digits (e.g., 0001, 0012)
    const seqStr = seqNum.toString().padStart(4, '0')

    // 3. Format date to DDYY
    const dateObj = new Date(eventDate)
    const dd = dateObj.getDate().toString().padStart(2, '0')
    const yy = dateObj.getFullYear().toString().slice(-2)

    return `${eventCode}${seqStr}${dd}${yy}`
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { registration_ids } = body // Array of registration IDs

        if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
            return NextResponse.json(
                { error: 'Tidak ada data pendaftaran yang dipilih' },
                { status: 400 }
            )
        }

        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Harus login untuk melakukan aksi ini.' },
                { status: 401 }
            )
        }

        // 1. Fetch all registrations with their event and user info using admin client
        const { data: registrations, error: fetchError } = await adminSupabase
            .from('event_registrations')
            .select(`
                *,
                events (
                    id,
                    title,
                    event_date,
                    event_time,
                    type,
                    location,
                    zoom_link,
                    organization_id,
                    organizations (name, username)
                )
            `)
            .in('id', registration_ids)
            .eq('status', 'pending')

        if (fetchError || !registrations || registrations.length === 0) {
            return NextResponse.json(
                { error: 'Data pendaftaran tidak valid atau sudah diproses' },
                { status: 404 }
            )
        }

        const processedIds = []
        const failedIds = []

        // Process each registration
        for (const reg of registrations) {
            try {
                const event = reg.events as any
                if (!event) continue

                const orgData = event.organizations as any
                if (!orgData) continue

                // 2. Update status to 'confirmed' USING THE USER CLIENT to enforce RLS
                // If the user is not an admin, this update will fail/skip
                const { data: updatedReg, error: updateError } = await supabase
                    .from('event_registrations')
                    .update({ status: 'confirmed' })
                    .eq('id', reg.id)
                    .select('id')
                    .single()

                if (updateError || !updatedReg) {
                    console.warn(`User ${user.id} tried to approve registration ${reg.id} but was rejected by RLS.`)
                    throw new Error('Unauthorized or already processed')
                }

                // 3. Generate Ticket
                // We use adminSupabase here to get accurate ticket sequence and insert safely
                const { data: existingTickets } = await adminSupabase
                    .from('event_tickets')
                    .select('id, event_registrations!inner(id)')
                    .eq('event_registrations.event_id', event.id)

                const nextSeqNum = (existingTickets?.length || 0) + 1

                const ticketNumber = generateTicketNumber(event.title, nextSeqNum, event.event_date)

                const { error: ticketError } = await adminSupabase
                    .from('event_tickets')
                    .insert({
                        registration_id: reg.id,
                        ticket_number: ticketNumber
                    })

                if (ticketError) throw ticketError

                // 4. Send Email
                const orgName = orgData.name || 'Circle'
                const orgUsername = orgData.username || ''
                const circleUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'}/o/${orgUsername}`

                const emailTemplate = getEventApprovalTemplate({
                    participantName: reg.name,
                    eventTitle: event.title,
                    eventDate: event.event_date,
                    eventTime: event.event_time,
                    eventType: event.type,
                    eventLocation: event.location,
                    zoomLink: event.zoom_link,
                    ticketNumber,
                    organizationName: orgName,
                    circleUrl,
                })

                await sendEmail({
                    to: reg.email,
                    subject: emailTemplate.subject,
                    html: emailTemplate.html,
                    from: EMAIL_SENDERS.circle,
                })

                processedIds.push(reg.id)
            } catch (err) {
                console.error(`Error processing approval for registration ${reg.id}:`, err)
                failedIds.push(reg.id)
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedIds.length,
            failed: failedIds.length,
            message: `Berhasil menyetujui ${processedIds.length} pendaftar.`
        })

    } catch (error: any) {
        console.error('Event approval API error:', error)
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}
