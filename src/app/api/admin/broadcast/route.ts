import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendEmail,
  EMAIL_SENDERS,
  getCreateCardPromoTemplate,
  getProUpgradePromoTemplate,
  getCompleteProfilePromoTemplate
} from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    // Ensure only APP_ADMIN can broadcast
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'APP_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { users, type, customSubject, customMessage } = body

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: false, error: 'No recipients provided' }, { status: 400 })
    }

    // Limit to 10 to avoid timeouts/rate limits
    if (users.length > 10) {
      return NextResponse.json({ success: false, error: 'Maximum 10 recipients per batch' }, { status: 400 })
    }

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const recipient of users) {
      if (!recipient.email || !recipient.full_name) {
        failedCount++
        continue
      }

      let subject = ''
      let html = ''

      switch (type) {
        case 'create_card': {
          const template = getCreateCardPromoTemplate({ userName: recipient.full_name })
          subject = template.subject
          html = template.html
          break
        }
        case 'upgrade_pro': {
          const template = getProUpgradePromoTemplate({ userName: recipient.full_name })
          subject = template.subject
          html = template.html
          break
        }
        case 'complete_profile': {
          const template = getCompleteProfilePromoTemplate({ userName: recipient.full_name })
          subject = template.subject
          html = template.html
          break
        }
        case 'custom': {
          if (!customSubject || !customMessage) {
            failedCount++
            errors.push('Missing custom subject or message')
            continue
          }
          subject = customSubject
          html = customMessage.replace(/{{name}}/g, recipient.full_name) // simple replace
          break
        }
        default:
          failedCount++
          errors.push(`Invalid broadcast type: ${type}`)
          continue
      }

      const emailResult = await sendEmail({
        to: recipient.email,
        subject,
        html,
        from: EMAIL_SENDERS.info
      })

      if (emailResult.success) {
        successCount++
      } else {
        failedCount++
        errors.push(`Failed to send to ${recipient.email}: ${emailResult.error}`)
      }

      // Log email
      await supabase.from('email_logs').insert({
        user_id: user.id, // Admin ID who initiated
        recipient_email: recipient.email,
        email_type: `broadcast_${type}`,
        subject: subject,
        status: emailResult.success ? 'sent' : 'failed',
        error_message: emailResult.error || null,
        metadata: { recipientName: recipient.full_name },
        sent_at: emailResult.success ? new Date().toISOString() : null
      })

      // Rate limit protection: Resend free tier limits to 2 req/sec.
      // Wait 500ms before sending the next email.
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      success: true,
      data: { successCount, failedCount, errors }
    })

  } catch (error: any) {
    console.error('Broadcast API error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
