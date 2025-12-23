// Email service using Resend
// You need to set RESEND_API_KEY in environment variables

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'Official ID <noreply@officialid.app>'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Email send failed:', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

// Email templates
export function getCardScannedEmailTemplate(data: {
  ownerName: string
  scannerName?: string
  scannerEmail?: string
  cardName: string
  cardUrl: string
}): { subject: string; html: string } {
  return {
    subject: `🎉 Kartu bisnis Anda "${data.cardName}" baru saja di-scan!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">📇</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Kartu Anda Di-scan!</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Halo <strong>${data.ownerName}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Kartu bisnis digital Anda <strong>"${data.cardName}"</strong> baru saja di-scan oleh seseorang.
          </p>
          
          ${data.scannerName || data.scannerEmail ? `
          <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1; font-weight: 600;">Detail Pengunjung:</p>
            ${data.scannerName ? `<p style="margin: 8px 0 0; color: #666;">Nama: ${data.scannerName}</p>` : ''}
            ${data.scannerEmail ? `<p style="margin: 4px 0 0; color: #666;">Email: ${data.scannerEmail}</p>` : ''}
          </div>
          ` : ''}
          
          <a href="${data.cardUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            Lihat Kartu Anda
          </a>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
            © ${new Date().getFullYear()} Official ID. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
  }
}

export function getPaymentVerifiedEmailTemplate(data: {
  userName: string
  amount: number
  status: 'approved' | 'rejected'
  reason?: string
}): { subject: string; html: string } {
  const isApproved = data.status === 'approved'
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(data.amount)

  return {
    subject: isApproved 
      ? `✅ Pembayaran Anda telah disetujui - Selamat menjadi Pro!`
      : `❌ Pembayaran Anda ditolak`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: ${isApproved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'}; border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">${isApproved ? '🎉' : '😔'}</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">
              ${isApproved ? 'Pembayaran Disetujui!' : 'Pembayaran Ditolak'}
            </h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Halo <strong>${data.userName}</strong>,
          </p>
          
          ${isApproved ? `
          <p style="color: #666; line-height: 1.6;">
            Pembayaran Anda sebesar <strong>${formattedAmount}</strong> telah diverifikasi dan disetujui. Selamat, akun Anda sekarang sudah <strong>Pro</strong>! 🎊
          </p>
          
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: 600;">Fitur Pro Anda:</p>
            <ul style="margin: 8px 0 0; padding-left: 20px; color: #666;">
              <li>Hingga 20 kartu bisnis digital</li>
              <li>Buat organisasi publik & privat</li>
              <li>Download kartu nama siap cetak</li>
              <li>Akses selamanya</li>
            </ul>
          </div>
          ` : `
          <p style="color: #666; line-height: 1.6;">
            Maaf, pembayaran Anda sebesar <strong>${formattedAmount}</strong> tidak dapat diverifikasi.
          </p>
          
          ${data.reason ? `
          <div style="background: #fef2f2; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">Alasan:</p>
            <p style="margin: 8px 0 0; color: #666;">${data.reason}</p>
          </div>
          ` : ''}
          
          <p style="color: #666; line-height: 1.6;">
            Silakan coba lagi atau hubungi support jika Anda merasa ini adalah kesalahan.
          </p>
          `}
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://officialid.app'}/dashboard" style="display: block; text-align: center; background: ${isApproved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)'}; color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            ${isApproved ? 'Mulai Gunakan Fitur Pro' : 'Coba Lagi'}
          </a>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
            © ${new Date().getFullYear()} Official ID. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
  }
}

export function getContactCardShareEmailTemplate(data: {
  senderName: string
  senderEmail: string
  recipientName: string
  cardName: string
  cardUrl: string
  message?: string
}): { subject: string; html: string } {
  return {
    subject: `${data.senderName} membagikan kartu bisnis digital kepada Anda`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #8B5CF6, #6D28D9); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">💼</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Kartu Bisnis Digital</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Halo <strong>${data.recipientName}</strong>,
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            <strong>${data.senderName}</strong> (${data.senderEmail}) ingin berbagi kartu bisnis digital dengan Anda.
          </p>
          
          ${data.message ? `
          <div style="background: #faf5ff; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #8B5CF6;">
            <p style="margin: 0; color: #666; font-style: italic;">"${data.message}"</p>
          </div>
          ` : ''}
          
          <a href="${data.cardUrl}" style="display: block; text-align: center; background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            Lihat Kartu Bisnis
          </a>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            Dengan Official ID, Anda juga bisa membuat kartu bisnis digital sendiri secara gratis!
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
            © ${new Date().getFullYear()} Official ID. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
  }
}
