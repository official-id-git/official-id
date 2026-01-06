import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendEmail,
  getCardScannedEmailTemplate,
  getPaymentVerifiedEmailTemplate,
  getContactCardShareEmailTemplate,
  getOrganizationInviteEmailTemplate,
  getShareCardEmailTemplate
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { type, data } = body

    let emailResult
    let logData: any = {
      user_id: user?.id || null,
      email_type: type,
      status: 'pending',
      metadata: data
    }

    switch (type) {
      case 'card_scanned': {
        // Get card owner info
        const { data: card } = await supabase
          .from('business_cards')
          .select('*, users(id, email, full_name, notify_on_scan)')
          .eq('id', data.cardId)
          .single()

        if (!card || !card.users?.notify_on_scan) {
          return NextResponse.json({ success: true, message: 'Notification disabled' })
        }

        const template = getCardScannedEmailTemplate({
          ownerName: card.users.full_name || 'User',
          scannerName: data.scannerName,
          scannerEmail: data.scannerEmail,
          cardName: card.full_name,
          cardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'}/c/${card.id}`
        })

        logData.recipient_email = card.users.email
        logData.subject = template.subject

        emailResult = await sendEmail({
          to: card.users.email,
          subject: template.subject,
          html: template.html
        })
        break
      }

      case 'payment_verified': {
        const template = getPaymentVerifiedEmailTemplate({
          userName: data.userName,
          amount: data.amount,
          status: data.status,
          reason: data.reason
        })

        logData.recipient_email = data.userEmail
        logData.subject = template.subject

        emailResult = await sendEmail({
          to: data.userEmail,
          subject: template.subject,
          html: template.html
        })
        break
      }

      case 'contact_card_share': {
        const template = getContactCardShareEmailTemplate({
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          recipientName: data.recipientName,
          cardName: data.cardName,
          cardUrl: data.cardUrl,
          message: data.message
        })

        logData.recipient_email = data.recipientEmail
        logData.subject = template.subject

        emailResult = await sendEmail({
          to: data.recipientEmail,
          subject: template.subject,
          html: template.html
        })
        break
      }

      case 'organization_invite': {
        const template = getOrganizationInviteEmailTemplate({
          recipientEmail: data.recipientEmail,
          organizationName: data.organizationName,
          organizationLogo: data.organizationLogo,
          inviterName: data.inviterName,
          inviterEmail: data.inviterEmail,
          message: data.message
        })

        logData.recipient_email = data.recipientEmail
        logData.subject = template.subject

        emailResult = await sendEmail({
          to: data.recipientEmail,
          subject: template.subject,
          html: template.html
        })
        break
      }

      case 'share_card': {
        const template = getShareCardEmailTemplate({
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          cardName: data.cardName,
          cardTitle: data.cardTitle,
          cardCompany: data.cardCompany,
          cardUrl: data.cardUrl,
          message: data.message
        })

        logData.recipient_email = data.recipientEmail
        logData.subject = template.subject

        emailResult = await sendEmail({
          to: data.recipientEmail,
          subject: template.subject,
          html: template.html
        })
        break
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid email type' }, { status: 400 })
    }

    // Log email
    logData.status = emailResult.success ? 'sent' : 'failed'
    logData.error_message = emailResult.error
    logData.sent_at = emailResult.success ? new Date().toISOString() : null

    await supabase.from('email_logs').insert(logData)

    return NextResponse.json({
      success: emailResult.success,
      error: emailResult.error
    })

  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
