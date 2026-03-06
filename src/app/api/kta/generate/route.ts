// KTA Generate API Route
// POST: Generate KTA card for a member

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateKTAImage, generateKTAPDF } from '@/lib/kta-generator'
import { uploadToGDrive, createGDriveFolder } from '@/lib/gdrive'
import QRCode from 'qrcode'

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

        const body = await request.json()
        const {
            organizationId,
            fullName,
            company,
            birthPlace,
            birthDate,
            professionalCompetency,
            photoUrl,
            city,
            province,
            whatsappNumber,
        } = body

        if (!organizationId || !fullName || !photoUrl) {
            return NextResponse.json(
                { success: false, error: 'organizationId, fullName, and photoUrl are required' },
                { status: 400 }
            )
        }

        // Verify user is approved member of this circle
        const { data: membership } = await supabase
            .from('organization_members')
            .select('status')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .eq('status', 'APPROVED')
            .single()

        if (!membership) {
            return NextResponse.json(
                { success: false, error: 'You must be an approved member of this circle' },
                { status: 403 }
            )
        }

        // Check if user already has a KTA for this circle
        const { data: existingKTA } = await adminSupabase
            .from('kta_applications')
            .select('id, status, gdrive_pdf_url, generated_card_url')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single()

        if (existingKTA && existingKTA.status === 'GENERATED') {
            return NextResponse.json(
                { success: false, error: 'You already have a KTA for this circle', data: existingKTA },
                { status: 400 }
            )
        }

        // Get template
        const { data: template } = await adminSupabase
            .from('kta_templates')
            .select('*')
            .eq('organization_id', organizationId)
            .single()

        if (!template) {
            return NextResponse.json(
                { success: false, error: 'KTA template has not been set up by admin' },
                { status: 400 }
            )
        }

        // Assign next available KTA number
        const { data: nextNumber, error: numError } = await adminSupabase
            .from('kta_numbers')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_used', false)
            .order('order_index', { ascending: true })
            .limit(1)
            .single()

        if (numError || !nextNumber) {
            return NextResponse.json(
                { success: false, error: 'No KTA numbers available. Please contact circle admin.' },
                { status: 400 }
            )
        }

        // Get organization info for folder naming
        const { data: org } = await adminSupabase
            .from('organizations')
            .select('name, username')
            .eq('id', organizationId)
            .single()

        const circleName = org?.name || organizationId

        // Create verification token
        const verificationToken = crypto.randomUUID()
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://official.id'
        const circleUsername = org?.username || organizationId
        const verificationUrl = `${baseUrl}/o/${circleUsername}/verify/${verificationToken}`

        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 300,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'M',
        })

        // Generate KTA card image
        const ktaImageBuffer = await generateKTAImage(
            template.template_image_url,
            template.field_positions,
            {
                fullName,
                ktaNumber: nextNumber.kta_number,
                photoUrl,
                qrCodeDataUrl,
            }
        )

        // Generate PDF
        const pdfBuffer = await generateKTAPDF(ktaImageBuffer)

        // Upload to Google Drive
        let gdriveResult = { fileId: '', webViewLink: '', webContentLink: '' }
        try {
            // Try to create a subfolder for this circle if needed
            let circleFolderId: string | undefined
            try {
                circleFolderId = await createGDriveFolder(`KTA_${circleName}`)
            } catch {
                // Use root folder if subfolder creation fails
                console.warn('Could not create circle subfolder, using root folder')
            }

            const safeFileName = `KTA_${fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${nextNumber.kta_number}.pdf`
            gdriveResult = await uploadToGDrive(
                pdfBuffer,
                safeFileName,
                'application/pdf',
                circleFolderId
            )
        } catch (gdriveError) {
            console.error('Google Drive upload failed:', gdriveError)
            // Continue without GDrive - we'll still save the application
        }

        // Mark KTA number as used
        await adminSupabase
            .from('kta_numbers')
            .update({ is_used: true, assigned_to: user.id })
            .eq('id', nextNumber.id)

        // Save/update application record
        const applicationData = {
            organization_id: organizationId,
            user_id: user.id,
            kta_number_id: nextNumber.id,
            full_name: fullName,
            company: company || null,
            birth_place: birthPlace || null,
            birth_date: birthDate || null,
            professional_competency: professionalCompetency || null,
            photo_url: photoUrl,
            city: city || null,
            province: province || null,
            whatsapp_number: whatsappNumber || null,
            status: 'GENERATED',
            gdrive_file_id: gdriveResult.fileId || null,
            gdrive_pdf_url: gdriveResult.webViewLink || null,
            verification_token: verificationToken,
        }

        let result
        if (existingKTA) {
            // Update existing application
            const { data, error } = await adminSupabase
                .from('kta_applications')
                .update(applicationData)
                .eq('id', existingKTA.id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else {
            // Insert new application
            const { data, error } = await adminSupabase
                .from('kta_applications')
                .insert(applicationData)
                .select()
                .single()
            if (error) throw error
            result = data
        }

        // Also update user profile with the new data
        await adminSupabase
            .from('users')
            .update({
                birth_place: birthPlace || undefined,
                birth_date: birthDate || undefined,
                province: province || undefined,
                professional_competency: professionalCompetency || undefined,
                phone: whatsappNumber || undefined,
                company: company || undefined,
            })
            .eq('id', user.id)

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                ktaNumber: nextNumber.kta_number,
                downloadUrl: gdriveResult.webContentLink || null,
                viewUrl: gdriveResult.webViewLink || null,
            }
        })
    } catch (error: any) {
        console.error('POST /api/kta/generate error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
