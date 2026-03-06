// KTA Numbers API Route
// POST: Upload KTA numbers from Excel
// PUT: Add a single KTA number manually
// GET: Fetch KTA number stats
// DELETE: Remove all unused KTA numbers

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'organizationId is required' },
                { status: 400 }
            )
        }

        const supabase = await createClient() as any

        // Fetch all KTA numbers with stats
        const { data: numbers, error } = await supabase
            .from('kta_numbers')
            .select('*')
            .eq('organization_id', organizationId)
            .order('order_index', { ascending: true })

        if (error) throw error

        const total = numbers?.length || 0
        const used = numbers?.filter((n: any) => n.is_used).length || 0
        const available = total - used

        return NextResponse.json({
            success: true,
            data: {
                numbers: numbers || [],
                stats: { total, used, available }
            }
        })
    } catch (error: any) {
        console.error('GET /api/kta/numbers error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

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

        const formData = await request.formData()
        const organizationId = formData.get('organizationId') as string
        const file = formData.get('file') as File

        if (!organizationId || !file) {
            return NextResponse.json(
                { success: false, error: 'organizationId and file are required' },
                { status: 400 }
            )
        }

        // Verify admin
        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Only circle admins can upload KTA numbers' },
                { status: 403 }
            )
        }

        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        // Extract KTA numbers from first column
        const ktaNumbers: string[] = []
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            if (row && row[0] !== undefined && row[0] !== null) {
                const num = String(row[0]).trim()
                if (num && num !== '' && num.toLowerCase() !== 'no kta' && num.toLowerCase() !== 'nomor kta') {
                    ktaNumbers.push(num)
                }
            }
        }

        if (ktaNumbers.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No KTA numbers found in the Excel file' },
                { status: 400 }
            )
        }

        // Get current max order_index
        const { data: existing } = await adminSupabase
            .from('kta_numbers')
            .select('order_index')
            .eq('organization_id', organizationId)
            .order('order_index', { ascending: false })
            .limit(1)

        const startIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0

        // Bulk insert KTA numbers
        const inserts = ktaNumbers.map((num, i) => ({
            organization_id: organizationId,
            kta_number: num,
            order_index: startIndex + i,
        }))

        const { data: inserted, error: insertError } = await adminSupabase
            .from('kta_numbers')
            .upsert(inserts, { onConflict: 'organization_id,kta_number', ignoreDuplicates: true })
            .select()

        if (insertError) throw insertError

        return NextResponse.json({
            success: true,
            data: {
                uploaded: inserted?.length || 0,
                total: ktaNumbers.length,
                duplicatesSkipped: ktaNumbers.length - (inserted?.length || 0),
            }
        })
    } catch (error: any) {
        console.error('POST /api/kta/numbers error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// PUT: Add a single KTA number manually
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { organizationId, ktaNumber } = body

        if (!organizationId || !ktaNumber) {
            return NextResponse.json(
                { success: false, error: 'organizationId and ktaNumber are required' },
                { status: 400 }
            )
        }

        const trimmedNumber = String(ktaNumber).trim()
        if (!trimmedNumber) {
            return NextResponse.json(
                { success: false, error: 'KTA number cannot be empty' },
                { status: 400 }
            )
        }

        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Only circle admins can add KTA numbers' },
                { status: 403 }
            )
        }

        // Check for duplicate
        const { data: existing } = await adminSupabase
            .from('kta_numbers')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('kta_number', trimmedNumber)
            .maybeSingle()

        if (existing) {
            return NextResponse.json(
                { success: false, error: `Nomor KTA "${trimmedNumber}" sudah ada dalam daftar` },
                { status: 409 }
            )
        }

        // Get current max order_index
        const { data: lastNum } = await adminSupabase
            .from('kta_numbers')
            .select('order_index')
            .eq('organization_id', organizationId)
            .order('order_index', { ascending: false })
            .limit(1)

        const nextIndex = lastNum && lastNum.length > 0 ? lastNum[0].order_index + 1 : 0

        const { data: inserted, error: insertError } = await adminSupabase
            .from('kta_numbers')
            .insert({
                organization_id: organizationId,
                kta_number: trimmedNumber,
                order_index: nextIndex,
            })
            .select()
            .single()

        if (insertError) throw insertError

        return NextResponse.json({
            success: true,
            data: inserted
        })
    } catch (error: any) {
        console.error('PUT /api/kta/numbers error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

// DELETE: Remove all unused KTA numbers for a circle
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        // Try getting user from cookie-based client first
        let userId: string | null = null

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            userId = user.id
        }

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const organizationId = searchParams.get('organizationId')

        if (!organizationId) {
            return NextResponse.json(
                { success: false, error: 'organizationId is required' },
                { status: 400 }
            )
        }

        // Use adminSupabase for checking admin status since regular supabase 
        // might have RLS issues with cookie-based auth on DELETE
        const isAdmin = await checkCircleAdminWithAdmin(adminSupabase, organizationId, userId)
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Only circle admins can delete KTA numbers' },
                { status: 403 }
            )
        }

        const { error } = await adminSupabase
            .from('kta_numbers')
            .delete()
            .eq('organization_id', organizationId)
            .eq('is_used', false)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('DELETE /api/kta/numbers error:', error)
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

// Same as checkCircleAdmin but uses adminSupabase (bypasses RLS)
async function checkCircleAdminWithAdmin(adminSupabase: any, organizationId: string, userId: string): Promise<boolean> {
    const { data: org } = await adminSupabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organizationId)
        .single()

    if (org?.owner_id === userId) return true

    const { data: member } = await adminSupabase
        .from('organization_members')
        .select('is_admin, role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .single()

    if (member?.is_admin || member?.role === 'ADMIN' || member?.role === 'OWNER') return true

    const { data: userData } = await adminSupabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    return userData?.role === 'APP_ADMIN'
}
