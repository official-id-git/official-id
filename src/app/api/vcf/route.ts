import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface BusinessCard {
    full_name: string
    job_title: string | null
    company: string | null
    phone: string
    email: string
    website: string | null
    username: string
    profile_photo_url: string | null
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('u')

    if (!username) {
        return new NextResponse('Username required', { status: 400 })
    }

    const supabase = await createClient()

    // Query business card
    const { data, error } = await supabase
        .from('business_cards')
        .select('full_name, job_title, company, phone, email, website, username, profile_photo_url')
        .ilike('username', username)
        .eq('is_public', true)
        .single()

    if (error || !data) {
        return new NextResponse('Card not found', { status: 404 })
    }

    const card = data as unknown as BusinessCard

    // Construct VCard 3.0
    const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${card.full_name}`,
        `N:;${card.full_name};;;`,
        card.company ? `ORG:${card.company};${card.job_title || ''}` : null,
        card.job_title ? `TITLE:${card.job_title}` : null,
        `TEL;TYPE=CELL:${card.phone}`,
        `EMAIL:${card.email}`,
        card.website ? `URL:${card.website}` : null,
        `URL:https://official.id/c/${card.username}`,
        `NOTE:Digital Business Card: https://official.id/c/${card.username}`,
        'END:VCARD'
    ]
        .filter(Boolean)
        .join('\n')

    return new NextResponse(vcard, {
        headers: {
            'Content-Type': 'text/vcard; charset=utf-8',
            'Content-Disposition': `attachment; filename="${card.full_name.replace(/\s+/g, '_')}.vcf"`,
        },
    })
}

