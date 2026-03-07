import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // id = repository file id
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // 2. Get repository info with related organization
        // Using RLS, if the user can't see this repo (not a member), this query will return nothing
        type OrgRepo = Database['public']['Tables']['organization_repositories']['Row']

        const { data: repoData, error: repoError } = await supabase
            .from('organization_repositories')
            .select('*, organizations(username)')
            .eq('id', id)
            .single()

        const repo = repoData as unknown as (OrgRepo & { organizations: { username: string } })

        if (repoError || !repo) {
            return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 })
        }

        // 3. Increment download counter
        // Call an RPC or do a direct update
        type OrgRepoUpdate = Database['public']['Tables']['organization_repositories']['Update']
        const updateData: OrgRepoUpdate = { download_count: repo.download_count + 1 }

        const { error: updateError } = await (supabase as any)
            .from('organization_repositories')
            .update(updateData)
            .eq('id', id)

        if (updateError) {
            console.error('Failed to increment download count', updateError)
        }

        // 4. Redirect to the GDrive Web Content Link (for direct download) or Web View Link
        const redirectUrl = repo.gdrive_web_content_link || repo.gdrive_web_view_link
        if (!redirectUrl) {
            return NextResponse.json({ error: 'Download link unavailable' }, { status: 404 })
        }

        return NextResponse.redirect(redirectUrl)

    } catch (error: any) {
        console.error('Error handling download:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
