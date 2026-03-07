import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGDriveFolder, uploadToGDrive, deleteFromGDrive, findGDriveFolderByName, initiateResumableUpload, setGDriveFilePermissions } from '@/lib/gdrive'
import type { Database } from '@/types/database.types'

const ALLOWED_MIME_TYPES = [
    'video/mp4', 'video/quicktime', // MP4, MOV
    'application/pdf', // PDF
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // EXCEL
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' // PPTX
]

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is member (or owner/superadmin via RLS)
        // We let RLS handle the actual data filtering, but we can return early if they are not a member
        const { data: repositories, error } = await supabase
            .from('organization_repositories')
            .select('*, event:events(title)')
            .eq('organization_id', id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, data: repositories })
    } catch (error: any) {
        console.error('Error fetching repositories:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        // 1. Auth check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Permission check (Must be admin or owner or superadmin)
        // We can do a quick check to see if user has admin rights for this org
        const { data: orgMember } = await supabase
            .from('organization_members')
            .select('is_admin')
            .eq('organization_id', id)
            .eq('user_id', user.id)
            .single()

        const { data: org } = await supabase
            .from('organizations')
            .select('owner_id')
            .eq('id', id)
            .single()

        const { data: authUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const _orgMember: any = orgMember
        const _org: any = org
        const _authUser: any = authUser

        const isAuthorized =
            (_orgMember && _orgMember.is_admin) ||
            (_org && _org.owner_id === user.id) ||
            (_authUser && _authUser.role === 'APP_ADMIN')

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
        }

        // 3. Parse JSON payload for resumable upload
        const payload = await request.json()
        const action = payload.action

        if (action === 'init') {
            const { title, fileName, mimeType, category: categoryId, event_id: eventId } = payload

            if (!title || !fileName || !mimeType || !categoryId || !eventId) {
                return NextResponse.json({ error: 'Missing required init fields' }, { status: 400 })
            }

            // Fetch Event details to name the folder properly
            const { data: eventData } = await supabase
                .from('events')
                .select('title')
                .eq('id', eventId)
                .single()
            const eventTitle = (eventData as any)?.title || `Event ${eventId.split('-')[0]}`

            // Ensure Nested Folder Strategy: Root -> Category -> Event -> File
            console.log(`[Repository] Init Upload for Cat: ${categoryId}, Event: ${eventTitle}`)

            let targetFolderId = null;
            try {
                let categoryFolderId = await findGDriveFolderByName(categoryId)
                if (!categoryFolderId) {
                    categoryFolderId = await createGDriveFolder(categoryId)
                }

                let eventFolderId = await findGDriveFolderByName(eventTitle, categoryFolderId)
                if (!eventFolderId) {
                    eventFolderId = await createGDriveFolder(eventTitle, categoryFolderId)
                }

                targetFolderId = eventFolderId;
            } catch (e: any) {
                console.error("Error creating nested folder hierarchy:", e)
                return NextResponse.json({ error: 'Failed to structuralize Google Drive folders' }, { status: 500 })
            }

            if (!targetFolderId) {
                return NextResponse.json({ error: 'Failed to resolve Google Drive folder target' }, { status: 500 })
            }

            const origin = request.headers.get('origin') || '';
            const sessionUri = await initiateResumableUpload(fileName, mimeType, targetFolderId, origin)
            return NextResponse.json({ success: true, sessionUri, targetFolderId })
        }

        if (action === 'finalize') {
            const { title, category: categoryId, event_id: eventId, fileId, webViewLink, webContentLink, targetFolderId, mimeType } = payload

            if (!fileId || !webViewLink || !webContentLink || !title || !categoryId || !eventId) {
                return NextResponse.json({ error: 'Missing required finalize fields' }, { status: 400 })
            }

            // Set file permissions so users can view/download
            await setGDriveFilePermissions(fileId)

            type OrgRepoInsert = Database['public']['Tables']['organization_repositories']['Insert']
            const insertData: OrgRepoInsert = {
                organization_id: id,
                title: title,
                file_type: mimeType,
                gdrive_file_id: fileId,
                gdrive_folder_id: targetFolderId,
                gdrive_web_view_link: webViewLink,
                gdrive_web_content_link: webContentLink,
                category: categoryId,
                event_id: eventId
            }

            const { data: repoRecord, error: dbError } = await supabase
                .from('organization_repositories')
                .insert(insertData as any)
                .select()
                .single()

            if (dbError) {
                console.error("DB Insert failed, rolling back GDrive.", dbError)
                await deleteFromGDrive(fileId)
                throw dbError
            }

            return NextResponse.json({ success: true, data: repoRecord })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        console.error('Error in repository upload handler:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()

        const { searchParams } = new URL(request.url)
        const repoId = searchParams.get('repoId')

        if (!repoId) {
            return NextResponse.json({ error: 'repoId is required' }, { status: 400 })
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check permission 
        const { data: orgMember } = await supabase.from('organization_members').select('is_admin').eq('organization_id', id).eq('user_id', user.id).single()
        const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', id).single()
        const { data: authUser } = await supabase.from('users').select('role').eq('id', user.id).single()

        const isAuthorized = (orgMember && (orgMember as any).is_admin) || (org && (org as any).owner_id === user.id) || (authUser && (authUser as any).role === 'APP_ADMIN')

        if (!isAuthorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        // Retrieve file information
        const { data: repo, error: fetchErr } = await supabase
            .from('organization_repositories')
            .select('gdrive_file_id')
            .eq('id', repoId)
            .eq('organization_id', id)
            .single()

        if (fetchErr || !repo) {
            return NextResponse.json({ error: 'Repository record not found' }, { status: 404 })
        }

        // Delete from Drive
        try {
            await deleteFromGDrive((repo as any).gdrive_file_id)
        } catch (e) {
            console.error("Failed to delete from GDrive, ignoring DB deletion.", e)
            return NextResponse.json({ error: 'Failed to access Google Drive' }, { status: 500 })
        }

        // Delete from Database
        const { error: delErr } = await supabase
            .from('organization_repositories')
            .delete()
            .eq('id', repoId)
            .eq('organization_id', id)

        if (delErr) throw delErr;

        return NextResponse.json({ success: true, message: 'Deleted successfully' })
    } catch (err: any) {
        console.error('DELETE repository error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
