import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
    try {
        const params = await context.params
        const applicationId = params.id
        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { full_name, company, professional_competency, city, whatsapp_number, photo_url } = body

        // Fetch application to verify admin rights
        const { data: application, error: fetchError } = await adminSupabase
            .from('kta_applications')
            .select('organization_id')
            .eq('id', applicationId)
            .single()

        if (fetchError || !application) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
        }

        // Verify circle admin
        const isAdmin = await checkCircleAdmin(supabase, application.organization_id, user.id)
        if (!isAdmin) {
            return NextResponse.json({ success: false, error: 'Only circle admins can edit applications' }, { status: 403 })
        }

        // Update application data
        const updateData: any = {}
        if (full_name !== undefined) updateData.full_name = full_name
        if (company !== undefined) updateData.company = company
        if (professional_competency !== undefined) updateData.professional_competency = professional_competency
        if (city !== undefined) updateData.city = city
        if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number
        if (photo_url !== undefined) updateData.photo_url = photo_url

        const { error: updateError } = await adminSupabase
            .from('kta_applications')
            .update(updateData)
            .eq('id', applicationId)

        if (updateError) throw updateError

        return NextResponse.json({ success: true, message: 'Application updated successfully' })
    } catch (error: any) {
        console.error('PATCH /api/kta/applications/[id] error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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
        .select('is_admin')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .single()

    if (member?.is_admin) return true

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    return userData?.role === 'APP_ADMIN'
}
