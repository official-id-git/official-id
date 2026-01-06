// EmailJS Client Service
// Docs: https://www.emailjs.com/docs/

const EMAILJS_SERVICE_ID = 'service_ou3njzd'
const EMAILJS_TEMPLATE_ID = 'template_mqaswhb'
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ''

interface EmailJSParams {
  to_email: string
  to_name?: string
  from_name: string
  from_email: string
  subject: string
  message: string
  card_url?: string
  org_name?: string
}

export async function sendEmailJS(params: EmailJSParams): Promise<{ success: boolean; error?: string }> {
  if (!EMAILJS_PUBLIC_KEY) {
    console.error('EMAILJS_PUBLIC_KEY not configured')
    return { success: false, error: 'Email service not configured. Please set NEXT_PUBLIC_EMAILJS_PUBLIC_KEY.' }
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: params,
      }),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const errorText = await response.text()
      console.error('EmailJS error:', errorText)
      return { success: false, error: errorText }
    }
  } catch (error: any) {
    console.error('EmailJS send error:', error)
    return { success: false, error: error.message }
  }
}

// Helper functions for different email types

export async function sendShareCardEmail(data: {
  recipientEmail: string
  recipientName?: string
  senderName: string
  senderEmail: string
  cardName: string
  cardTitle?: string
  cardCompany?: string
  cardUrl: string
  message?: string
}): Promise<{ success: boolean; error?: string }> {
  const emailMessage = `
${data.senderName} ingin berbagi kartu bisnis digital dengan Anda.

📇 Kartu Bisnis:
• Nama: ${data.cardName}
${data.cardTitle ? `• Jabatan: ${data.cardTitle}` : ''}
${data.cardCompany ? `• Perusahaan: ${data.cardCompany}` : ''}

${data.message ? `💬 Pesan: "${data.message}"` : ''}

🔗 Lihat Kartu: ${data.cardUrl}
  `.trim()

  return sendEmailJS({
    to_email: data.recipientEmail,
    to_name: data.recipientName || '',
    from_name: data.senderName,
    from_email: data.senderEmail,
    subject: `${data.senderName} membagikan kartu bisnis digital`,
    message: emailMessage,
    card_url: data.cardUrl,
  })
}

export async function sendOrgInviteEmail(data: {
  recipientEmail: string
  organizationName: string
  inviterName: string
  inviterEmail: string
  appUrl?: string
}): Promise<{ success: boolean; error?: string }> {
  const emailMessage = `
${data.inviterName} mengundang Anda untuk bergabung ke organisasi "${data.organizationName}" di Official ID.

🏢 Organisasi: ${data.organizationName}
👤 Diundang oleh: ${data.inviterName} (${data.inviterEmail})

Untuk menerima undangan, silakan daftar atau login dengan email ${data.recipientEmail} di:
${data.appUrl || 'https://official.id'}

⏰ Undangan ini berlaku selama 7 hari.
  `.trim()

  return sendEmailJS({
    to_email: data.recipientEmail,
    from_name: data.inviterName,
    from_email: data.inviterEmail,
    subject: `${data.inviterName} mengundang Anda ke ${data.organizationName}`,
    message: emailMessage,
    org_name: data.organizationName,
  })
}

export async function sendContactCardEmail(data: {
  recipientEmail: string
  recipientName: string
  senderName: string
  senderEmail: string
  cardName: string
  cardUrl: string
  message?: string
}): Promise<{ success: boolean; error?: string }> {
  const emailMessage = `
Halo ${data.recipientName},

${data.senderName} mengirimkan kartu bisnis digital kepada Anda.

${data.message ? `💬 Pesan: "${data.message}"` : ''}

🔗 Lihat Kartu: ${data.cardUrl}

---
Dengan Official ID, Anda juga bisa membuat kartu bisnis digital sendiri secara gratis!
  `.trim()

  return sendEmailJS({
    to_email: data.recipientEmail,
    to_name: data.recipientName,
    from_name: data.senderName,
    from_email: data.senderEmail,
    subject: `Kartu bisnis dari ${data.senderName}`,
    message: emailMessage,
    card_url: data.cardUrl,
  })
}
