import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGDriveFolder, uploadToGDrive, deleteFromGDrive } from '@/lib/gdrive'
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
            .select('*')
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

        // 3. Parse formdata
        const formData = await request.formData()
        const title = formData.get('title') as string
        const file = formData.get('file') as File

        if (!title || !file) {
            return NextResponse.json({ error: 'Title and file are required' }, { status: 400 })
        }

        // Validate file type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: MP4, MOV, PDF, DOCX, EXCEL, PPTX'
            }, { status: 400 })
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer())

        // 4. Create Folder in GDrive named exactly like the title
        // (Assuming GDRIVE_FOLDER_ID from env is the root for all uploads)
        console.log(`[Repository] Creating folder "${title}" for organization ${id}`)
        let folderId = null;
        try {
            folderId = await createGDriveFolder(title)
        } catch (e: any) {
            console.error("Error creating folder:", e)
            return NextResponse.json({ error: 'Failed to create folder in Google Drive' }, { status: 500 })
        }

        if (!folderId) {
            return NextResponse.json({ error: 'Failed to create folder in Google Drive' }, { status: 500 })
        }

        // 5. Upload file into that specific folder
        const ext = file.name.split('.').pop()
        const fileName = `${title}.${ext}`

        console.log(`[Repository] Uploading file to folder "${folderId}"`)
        const uploadResult = await uploadToGDrive(fileBuffer, fileName, file.type, folderId)

        // 6. Save to database
        // The insert will succeed if RLS allows it (we already checked authorization anyway)
        type OrgRepoInsert = Database['public']['Tables']['organization_repositories']['Insert']

        const insertData: OrgRepoInsert = {
            organization_id: id,
            title: title,
            file_type: file.type,
            gdrive_file_id: uploadResult.fileId,
            gdrive_folder_id: folderId,
            gdrive_web_view_link: uploadResult.webViewLink,
            gdrive_web_content_link: uploadResult.webContentLink,
        }

        const { data: repoRecord, error: dbError } = await supabase
            .from('organization_repositories')
            .insert(insertData as any)
            .select()
            .single()

        if (dbError) {
            // Rollback GDrive if DB fails
            console.error("DB Insert failed, rolling back GDrive.", dbError)
            await deleteFromGDrive(folderId) // delete the folder and its contents
            throw dbError
        }

        return NextResponse.json({ success: true, data: repoRecord })

    } catch (error: any) {
        console.error('Error uploading repository:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
