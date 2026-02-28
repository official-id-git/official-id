import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ticket_number, status } = body

        if (!ticket_number || !status) {
            return NextResponse.json(
                { error: 'Nomor tiket dan status kehadiran wajib diisi' },
                { status: 400 }
            )
        }

        const validStatuses = ['Hadir Tepat Waktu', 'Hadir Terlambat', 'Tidak Hadir']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Status kehadiran tidak valid' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Find the registration by ticket number
        const { data: ticket, error: ticketError } = await supabase
            .from('event_tickets')
            .select('registration_id, event_registrations(status)')
            .eq('ticket_number', ticket_number)
            .single()

        if (ticketError || !ticket) {
            return NextResponse.json(
                { error: 'Tiket tidak ditemukan' },
                { status: 404 }
            )
        }

        // Must be confirmed to RSVP
        const regData = ticket.event_registrations as any
        if (regData.status !== 'confirmed') {
            return NextResponse.json(
                { error: 'Pendaftaran belum dikonfirmasi' },
                { status: 400 }
            )
        }

        // 2. Check if RSVP already exists
        const { data: existingRsvp } = await supabase
            .from('event_rsvps')
            .select('id')
            .eq('registration_id', ticket.registration_id)
            .single()

        if (existingRsvp) {
            // Update existing
            const { error: updateError } = await supabase
                .from('event_rsvps')
                .update({ status })
                .eq('id', existingRsvp.id)

            if (updateError) throw updateError
        } else {
            // Insert new
            const { error: insertError } = await supabase
                .from('event_rsvps')
                .insert({
                    registration_id: ticket.registration_id,
                    status
                })

            if (insertError) throw insertError
        }

        return NextResponse.json({
            success: true,
            message: 'Konfirmasi kehadiran berhasil disimpan'
        })

    } catch (error: any) {
        console.error('Event RSVP API error:', error)
        return NextResponse.json(
            { error: 'Terjadi kesalahan server' },
            { status: 500 }
        )
    }
}
