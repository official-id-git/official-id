// Email service using Resend
// You need to set RESEND_API_KEY in environment variables

const RESEND_API_KEY = process.env.RESEND_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'

// Email sender addresses by type
export const EMAIL_SENDERS = {
  card: 'Official ID <card@official.id>',
  circle: 'Official ID <circle@official.id>',
  payment: 'Official ID <payment@official.id>',
  info: 'Official ID <info@official.id>',
  default: 'Official ID <card@official.id>'
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
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
        from: options.from || EMAIL_SENDERS.default,
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

// Organization Invitation Email Template
export function getOrganizationInviteEmailTemplate(data: {
  recipientEmail: string
  organizationName: string
  organizationLogo?: string
  inviterName: string
  inviterEmail: string
  message?: string
}): { subject: string; html: string } {
  return {
    subject: `${data.inviterName} mengundang Anda bergabung ke ${data.organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2D7C88 0%, #236B76 100%); padding: 40px 30px; text-align: center;">
                    ${data.organizationLogo ? `
                    <img src="${data.organizationLogo}" alt="${data.organizationName}" width="70" height="70" style="border-radius: 16px; margin-bottom: 16px;">
                    ` : `
                    <div style="width: 70px; height: 70px; margin: 0 auto 16px; background: rgba(255,255,255,0.15); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">🏢</span>
                    </div>
                    `}
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${data.organizationName}</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Undangan Bergabung</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 20px; font-weight: 600; text-align: center;">Anda Diundang!</h2>
                    
                    <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
                      <strong>${data.inviterName}</strong> (${data.inviterEmail}) mengundang Anda untuk bergabung ke organisasi <strong>${data.organizationName}</strong> di Official ID.
                    </p>
                    
                    ${data.message ? `
                    <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #2D7C88;">
                      <p style="margin: 0; color: #666; font-style: italic;">"${data.message}"</p>
                    </div>
                    ` : ''}
                    
                    <!-- CTA Button -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${APP_URL}/login?redirect=/dashboard/organizations" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2D7C88 0%, #236B76 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(45, 124, 136, 0.3);">
                            Terima Undangan
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0 0; color: #999999; font-size: 13px; text-align: center;">
                      Undangan ini berlaku selama 7 hari. Jika Anda belum memiliki akun, daftar dengan email <strong>${data.recipientEmail}</strong> untuk menerima undangan ini.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f8f8f8; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e5e5;">
                    <p style="margin: 0 0 8px; color: #999999; font-size: 12px;">
                      © 2025 Official ID. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
}

// Share Card via Email Template - Professional Design with Registration CTA
export function getShareCardEmailTemplate(data: {
  senderName: string
  senderEmail: string
  recipientEmail: string
  recipientName?: string
  cardName: string
  cardTitle?: string
  cardCompany?: string
  cardPhotoUrl?: string
  cardUrl: string
  message?: string
}): { subject: string; html: string } {
  const year = new Date().getFullYear()

  return {
    subject: `📇 ${data.senderName} membagikan kartu bisnis digital kepada Anda`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2D7C88 0%, #1A5A66 100%); padding: 35px 30px; text-align: center;">
                    <img src="https://res.cloudinary.com/dhr9kt7r5/image/upload/v1766548116/official-id/circles/dopjzc11o9fpqdfde63b.png" alt="Official ID" width="50" height="50" style="margin-bottom: 12px;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Kartu Bisnis Digital</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">dari Official ID</p>
                  </td>
                </tr>
                
                <!-- Greeting -->
                <tr>
                  <td style="padding: 35px 30px 0;">
                    <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                      Halo${data.recipientName ? ` <strong>${data.recipientName}</strong>` : ''} 👋
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      <strong style="color: #1e3a5f;">${data.senderName}</strong> ingin berbagi kartu bisnis digital dengan Anda untuk terhubung secara profesional.
                    </p>
                  </td>
                </tr>
                
                <!-- Card Preview Box -->
                <tr>
                  <td style="padding: 25px 30px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
                      <tr>
                        <td style="padding: 24px; text-align: center;">
                          <!-- Profile Photo -->
                          ${data.cardPhotoUrl ? `
                          <img src="${data.cardPhotoUrl}" alt="${data.cardName}" width="80" height="80" style="border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                          ` : `
                          <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg, #2D7C88, #1A5A66); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            <span style="font-size: 32px; color: #ffffff; font-weight: 700;">${data.cardName.charAt(0).toUpperCase()}</span>
                          </div>
                          `}
                          
                          <h2 style="margin: 0 0 6px; color: #111827; font-size: 20px; font-weight: 700;">${data.cardName}</h2>
                          ${data.cardTitle ? `<p style="margin: 0 0 4px; color: #4b5563; font-size: 15px; font-weight: 500;">${data.cardTitle}</p>` : ''}
                          ${data.cardCompany ? `<p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">🏢 ${data.cardCompany}</p>` : '<div style="margin-bottom: 16px;"></div>'}
                          
                          <!-- View Button -->
                          <a href="${data.cardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2D7C88 0%, #1A5A66 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 15px rgba(45, 124, 136, 0.35);">
                            📱 Lihat & Simpan Kontak
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Personal Message -->
                ${data.message ? `
                <tr>
                  <td style="padding: 0 30px 25px;">
                    <div style="background: #eff6ff; border-radius: 12px; padding: 18px 20px; border-left: 4px solid #2D7C88;">
                      <p style="margin: 0 0 6px; color: #1e40af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pesan dari ${data.senderName}</p>
                      <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6; font-style: italic;">"${data.message}"</p>
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 30px;">
                    <hr style="margin: 0; border: none; border-top: 1px solid #e5e7eb;">
                  </td>
                </tr>
                
                <!-- CTA Section - Registration Invite -->
                <tr>
                  <td style="padding: 30px; background: linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%);">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 8px; font-size: 18px;">✨</p>
                          <h3 style="margin: 0 0 10px; color: #1e3a5f; font-size: 17px; font-weight: 700;">Ingin punya kartu bisnis digital sendiri?</h3>
                          <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Buat kartu bisnis digital profesional Anda dalam hitungan detik. Gratis dan mudah dibagikan!
                          </p>
                          <a href="https://official.id/register" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.25);">
                            🚀 Buat Kartu Gratis Sekarang
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px;">
                      <a href="https://official.id" style="color: #2D7C88; text-decoration: none; font-weight: 600; font-size: 14px;">official.id</a>
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${year} Official ID. Kartu Bisnis Digital Indonesia.
                    </p>
                  </td>
                </tr>
                
              </table>
              
              <!-- Email Footer Note -->
              <p style="margin: 20px 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                Email ini dikirim atas nama ${data.senderName} melalui Official ID
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
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
    subject: `👋 ${data.senderName} ingin terhubung dengan Anda di Official ID`,
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

// ----------------------------------------------------------------------
// Circle Request Templates
// ----------------------------------------------------------------------

export function getCircleRequestAdminNotificationTemplate(data: {
  adminName?: string
  organizationName: string
  requesterEmail: string
  requesterMessage?: string
}): { subject: string; html: string } {
  const adminNameDisplay = data.adminName ? data.adminName : 'Admin'
  return {
    subject: `[${data.organizationName}] Permintaan Bergabung Baru dari ${data.requesterEmail}`,
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
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #F59E0B, #D97706); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">🔔</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Permintaan Bergabung</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">Halo <strong>${adminNameDisplay}</strong>,</p>
          <p style="color: #666; line-height: 1.6;">Ada seseorang yang ingin bergabung dengan Circle <strong>${data.organizationName}</strong>.</p>
          
          <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #F59E0B;">
            <p style="margin: 0 0 8px; color: #b45309; font-weight: 600;">Detail Pengaju:</p>
            <p style="margin: 0 0 8px; color: #666;"><strong>Email:</strong> ${data.requesterEmail}</p>
            ${data.requesterMessage ? `<p style="margin: 0; color: #666; font-style: italic;"><strong>Pesan:</strong> "${data.requesterMessage}"</p>` : ''}
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'}/dashboard/organizations" style="display: block; text-align: center; background: linear-gradient(135deg, #2D7C88 0%, #236B76 100%); color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            Lihat Permintaan di Dashboard
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

export function getCircleRequestApprovedTemplate(data: {
  organizationName: string
  organizationLogo?: string
  recipientEmail: string
}): { subject: string; html: string } {
  return {
    subject: `🎉 Permintaan bergabung Anda dengan ${data.organizationName} telah Disetujui!`,
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
            ${data.organizationLogo ? `
              <img src="${data.organizationLogo}" alt="${data.organizationName}" width="70" height="70" style="border-radius: 16px; margin-bottom: 16px;">
            ` : `
              <div style="width: 70px; height: 70px; margin: 0 auto 16px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✅</span>
              </div>
            `}
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Selamat bergabung!</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Selamat! Permintaan Anda untuk bergabung dengan Circle <strong>${data.organizationName}</strong> telah disetujui oleh admin.
          </p>
          
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: 600;">Langkah Selanjutnya:</p>
            <p style="margin: 8px 0 0; color: #666;">Silakan mendaftar (register) atau masuk (login) ke Official ID menggunakan email <strong>${data.recipientEmail}</strong>. Profil Anda akan secara otomatis terhubung dengan Circle ini.</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'}/register" style="display: block; text-align: center; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 24px 0;">
            Daftar & Lengkapi Profil
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

export function getCircleRequestRejectedTemplate(data: {
  organizationName: string
  organizationLogo?: string
}): { subject: string; html: string } {
  return {
    subject: `Status Permintaan Bergabung - ${data.organizationName}`,
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
            ${data.organizationLogo ? `
              <img src="${data.organizationLogo}" alt="${data.organizationName}" width="70" height="70" style="border-radius: 16px; margin-bottom: 16px; opacity: 0.8;">
            ` : `
              <div style="width: 70px; height: 70px; margin: 0 auto 16px; background: linear-gradient(135deg, #64748b, #475569); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✉️</span>
              </div>
            `}
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Pembaruan Status</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Terima kasih atas ketertarikan Anda untuk bergabung dengan Circle <strong>${data.organizationName}</strong>. 
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Mohon maaf, saat ini permintaan Anda belum dapat disetujui. Keputusan ini sepenuhnya merupakan kewenangan admin dari Circle tersebut dan dapat dikarenakan berbagai alasan internal.
          </p>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px; color: #0f172a; font-weight: 600;">Tahukah Anda?</p>
            <p style="margin: 0 0 16px; color: #475569;">Di Official ID, Anda dapat membuat kartu bisnis digital secara gratis dan bahkan membangun Circle Anda sendiri untuk komunitas Anda.</p>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://official.id'}/register" style="display: inline-block; background: linear-gradient(135deg, #2D7C88 0%, #236B76 100%); color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
                    Buat Kartu & Circle Sendiri
                  </a>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Tetap semangat dan jadilah bagian dari ekosistem Official ID!
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

export function getCircleRequestUserConfirmationTemplate(data: {
  userName?: string
  organizationName: string
}): { subject: string; html: string } {
  const userNameDisplay = data.userName ? ` <strong>${data.userName}</strong>` : ''
  return {
    subject: `Konfirmasi Permintaan Bergabung - ${data.organizationName}`,
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
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #2D7C88, #236B76); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 28px;">⏳</span>
            </div>
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Permintaan Terkirim</h1>
          </div>
          
          <p style="color: #666; line-height: 1.6;">Halo${userNameDisplay},</p>
          <p style="color: #666; line-height: 1.6;">Permintaan Anda untuk bergabung dengan Circle <strong>${data.organizationName}</strong> telah berhasil dikirim kepada admin.</p>
          
          <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #2D7C88;">
            <p style="margin: 0; color: #666;">Kami telah meneruskan email dan pesan Anda. Anda akan menerima notifikasi email lebih lanjut setelah admin meninjau permintaan Anda.</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">Terima kasih atas ketertarikan Anda untuk terhubung dengan komunitas di Official ID!</p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
            © ${new Date().getFullYear()} Official ID. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
  }
}
