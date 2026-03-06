import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateKTAImage, generateKTAPDF } from '@/lib/kta-generator'
import { uploadToGDrive, createGDriveFolder } from '@/lib/gdrive'
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
        const { applicationId, assignedNumberId, editedData, base64Image, base64Pdf } = body

        if (!applicationId || !base64Image || !base64Pdf) {
            return NextResponse.json({ success: false, error: 'applicationId, base64Image, and base64Pdf are required' }, { status: 400 })
        }

        // 1. Fetch Application & Verify Permissions
        const { data: application } = await adminSupabase
            .from('kta_applications')
            .select('*')
            .eq('id', applicationId)
            .single()

        if (!application) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
        }

        const organizationId = application.organization_id

        // Ensure current user is an admin of this circle
        const isAdmin = await checkCircleAdmin(supabase, organizationId, user.id)
        if (!isAdmin) {
            return NextResponse.json({ success: false, error: 'You are not authorized to approve KTA for this circle' }, { status: 403 })
        }

        if (application.status === 'GENERATED') {
            return NextResponse.json({ success: false, error: 'KTA is already generated' }, { status: 400 })
        }

        // 2. Prepare final data for generation (merging editedData)
        const finalData = {
            fullName: editedData?.fullName || application.full_name,
            company: editedData?.company !== undefined ? editedData.company : application.company,
            birthPlace: editedData?.birthPlace !== undefined ? editedData.birthPlace : application.birth_place,
            birthDate: editedData?.birthDate !== undefined ? editedData.birthDate : application.birth_date,
            professionalCompetency: editedData?.professionalCompetency !== undefined ? editedData.professionalCompetency : application.professional_competency,
            photoUrl: editedData?.photoUrl || application.photo_url,
            city: editedData?.city !== undefined ? editedData.city : application.city,
            province: editedData?.province !== undefined ? editedData.province : application.province,
            whatsappNumber: editedData?.whatsappNumber !== undefined ? editedData.whatsappNumber : application.whatsapp_number,
        }

        // 3. Assign/Verify KTA Number
        let numberIdToUse = assignedNumberId
        let ktaNumberString = ''

        if (numberIdToUse) {
            const { data: specificNumber } = await adminSupabase
                .from('kta_numbers')
                .select('*')
                .eq('id', numberIdToUse)
                .eq('organization_id', organizationId)
                .single()

            if (!specificNumber || specificNumber.is_used) {
                return NextResponse.json({ success: false, error: 'Selected KTA number is invalid or already used' }, { status: 400 })
            }
            ktaNumberString = specificNumber.kta_number
        } else {
            // Find next available number
            const { data: nextNumber, error: numError } = await adminSupabase
                .from('kta_numbers')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('is_used', false)
                .order('order_index', { ascending: true })
                .limit(1)
                .single()

            if (numError || !nextNumber) {
                return NextResponse.json({ success: false, error: 'No KTA numbers available. Please upload more.' }, { status: 400 })
            }
            numberIdToUse = nextNumber.id
            ktaNumberString = nextNumber.kta_number
        }

        // 4. Get template
        const { data: template } = await adminSupabase
            .from('kta_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .single()

        if (!template) {
            return NextResponse.json({ success: false, error: 'KTA template has not been set up by admin' }, { status: 400 })
        }

        // 5. Get organization info
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
        console.log('KTA Approve: Parsing image and PDF buffers from client...')
        const ktaImageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        const pdfBuffer = Buffer.from(base64Pdf.replace(/^data:application\/pdf;base64,/, ''), 'base64')

        console.log(`KTA Approve: Image buffer size: ${ktaImageBuffer.length} bytes`)
        console.log(`KTA Approve: PDF buffer size: ${pdfBuffer.length} bytes`)

        // Upload to Google Drive
        let gdriveResult = { fileId: '', webViewLink: '', webContentLink: '' }
        let gdriveImageResult = { fileId: '', webViewLink: '', webContentLink: '' }
        try {
            const { uploadToGDrive, createGDriveFolder, findGDriveFolderByName } = await import('@/lib/gdrive')

            let circleFolderId: string | undefined
            const targetFolderName = `KTA_${circleName}`

            try {
                // 1. Find or create Circle Folder
                console.log(`KTA Approve: Finding/creating circle folder: ${targetFolderName}`)
                const existingOrgFolderId = await findGDriveFolderByName(targetFolderName)
                if (existingOrgFolderId) {
                    circleFolderId = existingOrgFolderId
                    console.log(`KTA Approve: Found existing circle folder: ${circleFolderId}`)
                } else {
                    circleFolderId = await createGDriveFolder(targetFolderName)
                    console.log(`KTA Approve: Created new circle folder: ${circleFolderId}`)
                }

                // 2. Find or create Member Subfolder inside Circle Folder
                const memberFolderName = `${ktaNumberString} - ${finalData.fullName}`
                console.log(`KTA Approve: Finding/creating member folder: ${memberFolderName}`)
                const existingMemberFolderId = await findGDriveFolderByName(memberFolderName, circleFolderId)

                let memberFolderId: string
                if (existingMemberFolderId) {
                    memberFolderId = existingMemberFolderId
                    console.log(`KTA Approve: Found existing member folder: ${memberFolderId}`)
                } else {
                    memberFolderId = await createGDriveFolder(memberFolderName, circleFolderId)
                    console.log(`KTA Approve: Created new member folder: ${memberFolderId}`)
                }

                // Upload PDF to the Member's Subfolder
                const safeFileNamePDF = `${ktaNumberString}_${finalData.fullName.replace(/[^a-zA-Z0-9 ]/g, '_')}.pdf`
                console.log(`KTA Approve: Uploading PDF (${pdfBuffer.length} bytes) as "${safeFileNamePDF}" to folder ${memberFolderId}`)
                gdriveResult = await uploadToGDrive(
                    pdfBuffer,
                    safeFileNamePDF,
                    'application/pdf',
                    memberFolderId
                )
                console.log(`KTA Approve: PDF uploaded successfully. File ID: ${gdriveResult.fileId}`)

                // Upload Image to the Member's Subfolder
                const safeFileNameImage = `${ktaNumberString}_${finalData.fullName.replace(/[^a-zA-Z0-9 ]/g, '_')}.png`
                console.log(`KTA Approve: Uploading PNG (${ktaImageBuffer.length} bytes) as "${safeFileNameImage}" to folder ${memberFolderId}`)
                gdriveImageResult = await uploadToGDrive(
                    ktaImageBuffer,
                    safeFileNameImage,
                    'image/png',
                    memberFolderId
                )
                console.log(`KTA Approve: PNG uploaded successfully. File ID: ${gdriveImageResult.fileId}`)
            } catch (err: any) {
                console.error('KTA Approve: Folder/file operations failed:', err?.message || err)
                // Fallback upload to root if folders fail
                try {
                    const safeFileNamePDF = `KTA_${finalData.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${ktaNumberString}.pdf`
                    console.log(`KTA Approve: Fallback - uploading PDF to root folder`)
                    gdriveResult = await uploadToGDrive(
                        pdfBuffer,
                        safeFileNamePDF,
                        'application/pdf'
                    )

                    const safeFileNameImage = `KTA_${finalData.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${ktaNumberString}.png`
                    console.log(`KTA Approve: Fallback - uploading PNG to root folder`)
                    gdriveImageResult = await uploadToGDrive(
                        ktaImageBuffer,
                        safeFileNameImage,
                        'image/png'
                    )
                    console.log('KTA Approve: Fallback uploads succeeded')
                } catch (fallbackErr: any) {
                    console.error('KTA Approve: Fallback upload also failed:', fallbackErr?.message || fallbackErr)
                }
            }
        } catch (gdriveError: any) {
            console.error('KTA Approve: Google Drive initialization failed:', gdriveError?.message || gdriveError)
        }

        // 6. Update Database using admin client (bypassing RLS)
        // Mark KTA number as used
        await adminSupabase
            .from('kta_numbers')
            .update({ is_used: true, assigned_to: application.user_id })
            .eq('id', numberIdToUse)

        // Update application record status = GENERATED
        const { data: updatedApp, error: updateError } = await adminSupabase
            .from('kta_applications')
            .update({
                kta_number_id: numberIdToUse,
                full_name: finalData.fullName,
                company: finalData.company || null,
                birth_place: finalData.birthPlace || null,
                birth_date: finalData.birthDate || null,
                professional_competency: finalData.professionalCompetency || null,
                photo_url: finalData.photoUrl,
                city: finalData.city || null,
                province: finalData.province || null,
                whatsapp_number: finalData.whatsappNumber || null,
                status: 'GENERATED',
                gdrive_file_id: gdriveResult.fileId || null,
                gdrive_pdf_url: gdriveResult.webViewLink || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .select()
            .single()

        if (updateError) throw updateError

        // Try to update gdrive_image_url separately (column may not exist if migration 037 hasn't been applied)
        if (gdriveImageResult.webViewLink) {
            try {
                await adminSupabase
                    .from('kta_applications')
                    .update({ gdrive_image_url: gdriveImageResult.webViewLink })
                    .eq('id', applicationId)
            } catch (e) {
                console.warn('Could not update gdrive_image_url, migration 037 may not be applied:', e)
            }
        }

        // Update user's full_name on the users table (safe columns only)
        try {
            await adminSupabase
                .from('users')
                .update({
                    full_name: finalData.fullName,
                })
                .eq('id', application.user_id)
        } catch (e) {
            console.warn('Could not update users table:', e)
        }

        // Sync finalized KTA data to the user's business card
        // Fetch their email for the card
        const { data: userData } = await adminSupabase
            .from('users')
            .select('email')
            .eq('id', application.user_id)
            .single()

        const { data: existingCards } = await adminSupabase
            .from('business_cards')
            .select('id')
            .eq('user_id', application.user_id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (existingCards && existingCards.length > 0) {
            // Update their primary business card with the approved data
            await adminSupabase
                .from('business_cards')
                .update({
                    full_name: finalData.fullName,
                    company: finalData.company || undefined,
                    job_title: finalData.professionalCompetency || undefined,
                    phone: finalData.whatsappNumber || undefined,
                    city: finalData.city || undefined,
                    profile_photo_url: finalData.photoUrl,
                })
                .eq('id', existingCards[0].id)
        } else {
            // Auto-create a digital business card if they still don't have one
            const { data: defaultTemplate } = await adminSupabase
                .from('card_templates')
                .select('id')
                .eq('is_premium', false)
                .limit(1)
                .maybeSingle()

            await adminSupabase
                .from('business_cards')
                .insert({
                    user_id: application.user_id,
                    template_id: defaultTemplate?.id || null,
                    full_name: finalData.fullName,
                    company: finalData.company || '',
                    job_title: finalData.professionalCompetency || '',
                    phone: finalData.whatsappNumber || '',
                    city: finalData.city || '',
                    profile_photo_url: finalData.photoUrl,
                    email: userData?.email,
                })
        }

        // 7. Send "KTA Approved" Email
        try {
            const { sendEmail, getKTAApprovedEmailTemplate } = await import('@/lib/email')

            // Get user email
            const { data: userData } = await adminSupabase
                .from('users')
                .select('email')
                .eq('id', application.user_id)
                .single()

            if (userData?.email) {
                const approvedEmailTemplate = getKTAApprovedEmailTemplate({
                    memberName: finalData.fullName,
                    organizationName: circleName,
                    circleUsername,
                    ktaNumber: ktaNumberString,
                    recipientEmail: userData.email,
                    verificationToken: application.verification_token,
                })

                await sendEmail({
                    to: userData.email,
                    subject: approvedEmailTemplate.subject,
                    html: approvedEmailTemplate.html,
                })
            }
        } catch (emailErr) {
            console.error('Failed to send KTA Approved email:', emailErr)
        }

        return NextResponse.json({
            success: true,
            data: {
                ...updatedApp,
                ktaNumber: ktaNumberString,
                downloadUrl: gdriveResult.webContentLink || null,
                viewUrl: gdriveResult.webViewLink || null,
            }
        })
    } catch (error: any) {
        console.error('POST /api/kta/approve error:', error)
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
