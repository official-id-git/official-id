import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateKTAImage, generateKTAPDF } from '@/lib/kta-generator'

import QRCode from 'qrcode'

// Increase max duration for GDrive upload (default 10s is too short)
export const maxDuration = 60


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

        // Upload to Cloudinary for Image and PDF
        let cloudinaryPdfResult = { secure_url: '', public_id: '' }
        let cloudinaryImageResult = { secure_url: '', public_id: '' }

        try {
            const { uploadBufferToCloudinary } = await import('@/lib/cloudinary')
            const targetFolderName = `official-id_kta/KTA_${circleName.replace(/[^a-zA-Z0-9_-]/g, '_')}`

            // Upload PDF to Cloudinary
            const safeFileNamePDF = `${ktaNumberString}_${application.full_name.replace(/[^a-zA-Z0-9 ]/g, '_')}_pdf.pdf`
            console.log(`KTA Regenerate: Uploading PDF to Cloudinary`)

            cloudinaryPdfResult = await uploadBufferToCloudinary(
                pdfBuffer,
                'application/pdf',
                safeFileNamePDF,
                targetFolderName
            )
            console.log(`KTA Regenerate: PDF uploaded successfully. URL: ${cloudinaryPdfResult.secure_url}`)

            // Upload Image to Cloudinary
            const safeFileNameImage = `${ktaNumberString}_${application.full_name.replace(/[^a-zA-Z0-9 ]/g, '_')}_image.png`
            console.log(`KTA Regenerate: Uploading PNG to Cloudinary folder ${targetFolderName}`)

            cloudinaryImageResult = await uploadBufferToCloudinary(
                ktaImageBuffer,
                'image/png',
                safeFileNameImage,
                targetFolderName
            )
            console.log(`KTA Regenerate: PNG uploaded successfully. URL: ${cloudinaryImageResult.secure_url}`)

        } catch (uploadError: any) {
            console.error('KTA Regenerate: Cloudinary upload failed:', uploadError?.message || uploadError)
            throw new Error(`Gagal mengupload file KTA ke server: ${uploadError?.message || 'Unknown error'}`)
        }

        // NOTE: GDrive backup happens AFTER DB update below

        // 4. Update Database
        const { data: updatedApp, error: updateError } = await adminSupabase
            .from('kta_applications')
            .update({
                gdrive_file_id: cloudinaryPdfResult.public_id || null, // Storing Cloudinary public_id
                gdrive_pdf_url: cloudinaryPdfResult.secure_url || null, // Cloudinary PDF secure link
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .select()
            .single()

        if (updateError) throw updateError

        if (cloudinaryImageResult.secure_url) {
            try {
                await adminSupabase
                    .from('kta_applications')
                    .update({ gdrive_image_url: cloudinaryImageResult.secure_url })
                    .eq('id', applicationId)
            } catch (e) {
                // Ignore if migration 037 is not fully applied
            }
        }

        // GDrive backup (non-fatal) — happens AFTER DB is updated with Cloudinary URLs
        // Folder: KTA_{CircleName}/{KTA_Number}_{FullName}/
        //   ├── KTA_{number}_image.png
        //   └── KTA_{number}_pdf.pdf
        const gdriveKeySet = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        const gdriveFolderSet = !!process.env.GDRIVE_FOLDER_ID
        console.log(`[GDrive DEBUG] Env check — GOOGLE_SERVICE_ACCOUNT_KEY: ${gdriveKeySet}, GDRIVE_FOLDER_ID: ${gdriveFolderSet}`)

        if (!gdriveKeySet) {
            console.error('[GDrive DEBUG] Skipping GDrive backup: GOOGLE_SERVICE_ACCOUNT_KEY is not set.')
        } else {
            try {
                const { uploadToGDrive, findGDriveFolderByName, createGDriveFolder } = await import('@/lib/gdrive')
                const memberName = application.full_name
                const safeName = memberName.replace(/[^a-zA-Z0-9 ]/g, '_')
                const safeCircle = circleName.replace(/[^a-zA-Z0-9_-]/g, '_')
                const circleFolderName = `KTA_${safeCircle}`
                const memberFolderName = `${ktaNumberString}_${safeName}`

                console.log(`[GDrive DEBUG] Image buffer size: ${ktaImageBuffer.length} bytes`)
                console.log(`[GDrive DEBUG] PDF buffer size: ${pdfBuffer.length} bytes`)
                console.log(`[GDrive DEBUG] Circle folder name: "${circleFolderName}"`)
                console.log(`[GDrive DEBUG] Member folder name: "${memberFolderName}"`)

                // 1. Get/create circle-level folder
                let circleFolderId = await findGDriveFolderByName(circleFolderName)
                console.log(`[GDrive DEBUG] Circle folder ID found: ${circleFolderId}`)
                if (!circleFolderId) {
                    circleFolderId = await createGDriveFolder(circleFolderName)
                    console.log(`[GDrive DEBUG] Circle folder CREATED with ID: ${circleFolderId}`)
                }

                // 2. Get/create member-level subfolder inside the circle folder
                let memberFolderId = await findGDriveFolderByName(memberFolderName, circleFolderId)
                console.log(`[GDrive DEBUG] Member folder ID found: ${memberFolderId}`)
                if (!memberFolderId) {
                    memberFolderId = await createGDriveFolder(memberFolderName, circleFolderId)
                    console.log(`[GDrive DEBUG] Member folder CREATED with ID: ${memberFolderId}`)
                }

                const imageFileName = `KTA_${ktaNumberString}_image.png`
                const pdfFileName = `KTA_${ktaNumberString}_pdf.pdf`

                console.log(`[GDrive DEBUG] Uploading image "${imageFileName}" to folder ${memberFolderId}...`)
                const imgResult = await uploadToGDrive(ktaImageBuffer, imageFileName, 'image/png', memberFolderId)
                console.log(`[GDrive DEBUG] Image OK. fileId=${imgResult.fileId}`)

                console.log(`[GDrive DEBUG] Uploading PDF "${pdfFileName}" to folder ${memberFolderId}...`)
                const pdfResult = await uploadToGDrive(pdfBuffer, pdfFileName, 'application/pdf', memberFolderId)
                console.log(`[GDrive DEBUG] PDF OK. fileId=${pdfResult.fileId}`)

                console.log('[GDrive DEBUG] KTA Regenerate: GDrive backup COMPLETE.')
            } catch (gdriveError: any) {
                console.error('[GDrive DEBUG] KTA Regenerate: GDrive backup FAILED.')
                console.error('[GDrive DEBUG] Error message:', gdriveError?.message)
                console.error('[GDrive DEBUG] Error code:', gdriveError?.code)
                console.error('[GDrive DEBUG] Error stack:', gdriveError?.stack)
                console.error('[GDrive DEBUG] Full error:', JSON.stringify(gdriveError, Object.getOwnPropertyNames(gdriveError)))
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
