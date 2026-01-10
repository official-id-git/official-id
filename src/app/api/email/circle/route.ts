import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { EMAIL_SENDERS } from '@/lib/email'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const FROM_EMAIL = EMAIL_SENDERS.circle

// Log email to database
async function logEmail(data: {
  recipient_email: string
  subject: string
  email_type: string
  related_id?: string
  status: string
  resend_id?: string
  error_message?: string
  metadata?: Record<string, any>
}) {
  try {
    await supabase.from('email_logs').insert({
      recipient_email: data.recipient_email,
      sender_email: 'info@official.id',
      subject: data.subject,
      email_type: data.email_type,
      related_id: data.related_id,
      status: data.status,
      resend_id: data.resend_id,
      error_message: data.error_message,
      metadata: data.metadata,
      sent_at: data.status === 'sent' ? new Date().toISOString() : null,
    })
  } catch (err) {
    console.error('Failed to log email:', err)
  }
}

// HTML Template for Circle Message
function getCircleMessageTemplate(params: {
  recipientName: string
  senderName: string
  circleName: string
  message: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Official ID</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Pesan Baru dari Circle</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Halo <strong>${params.recipientName}</strong>,</p>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 24px 0;">Anda menerima pesan baru dari anggota Circle <strong style="color: #3B82F6;">${params.circleName}</strong>:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #1F2937; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">${params.senderName}</p>
                    <p style="color: #4B5563; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${params.message}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://official.id/dashboard/messages" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 14px;">Buka Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">© 2025 Official ID. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// HTML Template for Broadcast
function getCircleBroadcastTemplate(params: {
  recipientName: string
  circleName: string
  adminName: string
  message: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Official ID</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">📢 Broadcast dari Circle</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Halo <strong>${params.recipientName}</strong>,</p>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 24px 0;">Admin Circle <strong style="color: #8B5CF6;">${params.circleName}</strong> mengirim pesan broadcast:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%); border-radius: 12px; border-left: 4px solid #8B5CF6; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Dari: ${params.adminName}</p>
                    <p style="color: #1F2937; font-size: 15px; margin: 0; line-height: 1.7; white-space: pre-wrap;">${params.message}</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://official.id/dashboard/messages" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 14px;">Lihat di Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 8px 0;">Anda menerima email ini karena Anda adalah anggota Circle ${params.circleName}</p>
              <p style="color: #9CA3AF; font-size: 12px; margin: 0;">© 2025 Official ID. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// Helper function to add delay between emails (prevents rate limiting)
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Rate limit: 150ms between emails (~6-7 emails per second, safe for Resend)
const DELAY_BETWEEN_EMAILS_MS = 150

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, recipients, circleName, senderName, message, relatedId } = body

    if (!type || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const results = []

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i]

      // Add delay between emails (except for the first one)
      if (i > 0) {
        await sleep(DELAY_BETWEEN_EMAILS_MS)
      }

      const subject = type === 'broadcast'
        ? `[Broadcast] Pesan dari ${circleName}`
        : `Pesan baru dari ${senderName} di Circle ${circleName}`

      const html = type === 'broadcast'
        ? getCircleBroadcastTemplate({
          recipientName: recipient.name || 'Member',
          circleName,
          adminName: senderName,
          message,
        })
        : getCircleMessageTemplate({
          recipientName: recipient.name || 'Member',
          senderName,
          circleName,
          message,
        })

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email,
          subject,
          html,
        })

        if (error) {
          await logEmail({
            recipient_email: recipient.email,
            subject,
            email_type: type === 'broadcast' ? 'circle_broadcast' : 'circle_message',
            related_id: relatedId,
            status: 'failed',
            error_message: error.message,
            metadata: { circleName, senderName },
          })
          results.push({ email: recipient.email, success: false, error: error.message })
        } else {
          await logEmail({
            recipient_email: recipient.email,
            subject,
            email_type: type === 'broadcast' ? 'circle_broadcast' : 'circle_message',
            related_id: relatedId,
            status: 'sent',
            resend_id: data?.id,
            metadata: { circleName, senderName },
          })
          results.push({ email: recipient.email, success: true })
        }
      } catch (err: any) {
        await logEmail({
          recipient_email: recipient.email,
          subject,
          email_type: type === 'broadcast' ? 'circle_broadcast' : 'circle_message',
          related_id: relatedId,
          status: 'failed',
          error_message: err.message,
          metadata: { circleName, senderName },
        })
        results.push({ email: recipient.email, success: false, error: err.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: results.length - successCount,
      results
    })
  } catch (err: any) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
