import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateKTAImage, generateKTAPDF } from '@/lib/kta-generator'
import { uploadToGDrive, createGDriveFolder, findGDriveFolderByName } from '@/lib/gdrive'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient() as any
        const adminSupabase = createAdminClient() as any

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { applicationId, base64Image, base64Pdf } = body

        console.log("Regenerate Payload size:", JSON.stringify(body).length / 1024 / 1024, "MB")
        console.log("base64Image length:", base64Image?.length)
        console.log("base64Pdf length:", base64Pdf?.length)

        if (!applicationId) return NextResponse.json({ success: false, error: 'applicationId is required' }, { status: 400 })
        if (!base64Image) return NextResponse.json({ success: false, error: 'base64Image is required' }, { status: 400 })
        if (!base64Pdf) return NextResponse.json({ success: false, error: 'base64Pdf is required' }, { status: 400 })

        // 1. Fetch Application & Verify Permissions
        const { data: application } = await adminSupabase
            .from('kta_applications')
            .select('*, kta_numbers(kta_number)')
            .eq('id', applicationId)
            .single()

        if (!application) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
        }

        const organizationId = application.organization_id

        // Ensure current user is an admin of this circle
        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json({ success: false, error: 'You are not authorized to regenerate KTA for this circle' }, { status: 403 })
        }

        if (application.status !== 'GENERATED') {
            return NextResponse.json({ success: false, error: 'Only GENERATED KTA can be regenerated' }, { status: 400 })
        }

        if (!application.kta_numbers?.kta_number) {
            return NextResponse.json({ success: false, error: 'No KTA Number assigned to this application' }, { status: 400 })
        }

        const ktaNumberString = application.kta_numbers.kta_number

        // 2. Get template
        const { data: template } = await adminSupabase
            .from('kta_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .single()

        if (!template) {
            return NextResponse.json({ success: false, error: 'KTA template has not been set up by admin' }, { status: 400 })
        }

        // 3. Get organization info
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('name, username')
            .eq('id', organizationId)
            .single()

        const circleName = org?.name || organizationId
        const circleUsername = org?.username || organizationId
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://official.id'
        const verificationUrl = `${baseUrl}/o/${circleUsername}/verify/${application.verification_token}`

        // Parse base64 from client
        console.log('KTA Regenerate: Parsing image and PDF buffers from client...')
        const ktaImageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        const pdfBuffer = Buffer.from(base64Pdf.replace(/^data:application\/pdf;base64,/, ''), 'base64')

        console.log(`KTA Regenerate: Image buffer size: ${ktaImageBuffer.length} bytes`)
        console.log(`KTA Regenerate: PDF buffer size: ${pdfBuffer.length} bytes`)

        // Upload to Google Drive
        let gdriveResult = { fileId: '', webViewLink: '', webContentLink: '' }
        let gdriveImageResult = { fileId: '', webViewLink: '', webContentLink: '' }
        try {
            let circleFolderId: string | undefined
            const targetFolderName = `KTA_${circleName}`

            try {
                // Find or create Circle Folder
                console.log(`KTA Regenerate: Finding/creating circle folder: ${targetFolderName}`)
                const existingOrgFolderId = await findGDriveFolderByName(targetFolderName)
                if (existingOrgFolderId) {
                    circleFolderId = existingOrgFolderId
                    console.log(`KTA Regenerate: Found circle folder: ${circleFolderId}`)
                } else {
                    circleFolderId = await createGDriveFolder(targetFolderName)
                    console.log(`KTA Regenerate: Created circle folder: ${circleFolderId}`)
                }

                // Find or create Member Subfolder
                const memberFolderName = `${ktaNumberString} - ${application.full_name}`
                console.log(`KTA Regenerate: Finding/creating member folder: ${memberFolderName}`)
                const existingMemberFolderId = await findGDriveFolderByName(memberFolderName, circleFolderId)

                let memberFolderId: string
                if (existingMemberFolderId) {
                    memberFolderId = existingMemberFolderId
                    console.log(`KTA Regenerate: Found member folder: ${memberFolderId}`)
                } else {
                    memberFolderId = await createGDriveFolder(memberFolderName, circleFolderId)
                    console.log(`KTA Regenerate: Created member folder: ${memberFolderId}`)
                }

                // Upload PDF
                const safeFileNamePDF = `${ktaNumberString}_${application.full_name.replace(/[^a-zA-Z0-9 ]/g, '_')}.pdf`
                console.log(`KTA Regenerate: Uploading PDF to folder ${memberFolderId}`)
                gdriveResult = await uploadToGDrive(pdfBuffer, safeFileNamePDF, 'application/pdf', memberFolderId)

                // Upload Image
                const safeFileNameImage = `${ktaNumberString}_${application.full_name.replace(/[^a-zA-Z0-9 ]/g, '_')}.png`
                console.log(`KTA Regenerate: Uploading PNG to folder ${memberFolderId}`)
                gdriveImageResult = await uploadToGDrive(ktaImageBuffer, safeFileNameImage, 'image/png', memberFolderId)
            } catch (err: any) {
                console.error('KTA Regenerate: Folder/file operations failed:', err?.message || err)
                // Fallback to root
                try {
                    const safeFileNamePDF = `KTA_${application.full_name.replace(/[^a-zA-Z0-9]/g, '_')}_${ktaNumberString}.pdf`
                    gdriveResult = await uploadToGDrive(pdfBuffer, safeFileNamePDF, 'application/pdf')

                    const safeFileNameImage = `KTA_${application.full_name.replace(/[^a-zA-Z0-9]/g, '_')}_${ktaNumberString}.png`
                    gdriveImageResult = await uploadToGDrive(ktaImageBuffer, safeFileNameImage, 'image/png')
                } catch (fallbackErr: any) {
                    console.error('KTA Regenerate: Fallback upload failed:', fallbackErr?.message || fallbackErr)
                }
            }
        } catch (gdriveError: any) {
            console.error('KTA Regenerate: Google Drive init failed:', gdriveError?.message || gdriveError)
        }

        // 4. Update Database
        const { data: updatedApp, error: updateError } = await adminSupabase
            .from('kta_applications')
            .update({
                gdrive_file_id: gdriveResult.fileId || null,
                gdrive_pdf_url: gdriveResult.webViewLink || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .select()
            .single()

        if (updateError) throw updateError

        if (gdriveImageResult.webViewLink) {
            try {
                await adminSupabase
                    .from('kta_applications')
                    .update({ gdrive_image_url: gdriveImageResult.webViewLink })
                    .eq('id', applicationId)
            } catch (e) {
                // Ignore if migration 037 is not fully applied
            }
        }

        return NextResponse.json({ success: true, data: updatedApp })
    } catch (error: any) {
        console.error('POST /api/kta/regenerate error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

async function checkCircleAdmin(supabase: any, organizationId: string, userId: string): Promise<boolean> {
    const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', organizationId).single()
    if (org?.owner_id === userId) return true

    const { data: member } = await supabase.from('organization_members').select('is_admin, role').eq('organization_id', organizationId).eq('user_id', userId).eq('status', 'APPROVED').single()
    if (member?.is_admin || member?.role === 'ADMIN' || member?.role === 'OWNER') return true

    const { data: userData } = await supabase.from('users').select('role').eq('id', userId).single()
    return userData?.role === 'APP_ADMIN'
}
