// EmailJS Client Service
// Docs: https://www.emailjs.com/docs/

const EMAILJS_SERVICE_ID = 'service_ou3njzd'
const EMAILJS_TEMPLATE_ID = 'template_mqaswhb' // Default template
const EMAILJS_CONTACT_TEMPLATE_ID = 'template_72j381y' // Professional Contact Template
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
  // New template params
  user_name?: string
  reply_to?: string
  message_html?: string
}

export async function sendEmailJS(
  params: EmailJSParams,
  templateId: string = EMAILJS_TEMPLATE_ID
): Promise<{ success: boolean; error?: string }> {
  if (!EMAILJS_PUBLIC_KEY) {
    console.error('EMAILJS_PUBLIC_KEY not configured')
    return { success: false, error: 'Email service not configured. Please set NEXT_PUBLIC_EMAILJS_PUBLIC_KEY.' }
  }

  // Map params to match the new template requirements if using the new template
  const finalParams = {
    ...params,
    user_name: params.from_name,
    reply_to: params.from_email,
    // Ensure message_html is passed if present
    message_html: params.message_html,
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: finalParams,
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

// ... unchanged helpers ...

function generateContactCardHtml(data: {
  recipientName: string
  senderName: string
  cardName: string
  cardUrl: string
  cardPhotoUrl?: string
  cardJobTitle?: string
  cardCompany?: string
  message?: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
     <!-- Header -->
     <div style="padding: 24px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #f4f4f5;">
       <h2 style="margin: 0; color: #2563eb; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Official ID</h2>
     </div>
     
     <!-- Content -->
     <div style="padding: 32px 24px;">
       <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 24px;">
         Halo <strong>${data.recipientName}</strong>,
       </p>
       <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 24px;">
         <strong>${data.senderName}</strong> mengirimkan kartu bisnis digital kepada Anda untuk terhubung secara profesional.
       </p>

       <!-- Card Preview -->
       <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px 24px; margin-bottom: 24px; text-align: center; background-color: #f8fafc;">
          ${data.cardPhotoUrl ? `<img src="${data.cardPhotoUrl}" alt="Profile" style="width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 4px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">` : ''}
          <h3 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">${data.cardName}</h3>
          ${data.cardJobTitle ? `<p style="margin: 0 0 4px; color: #4b5563; font-size: 15px; font-weight: 500;">${data.cardJobTitle}</p>` : ''}
          ${data.cardCompany ? `<p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">${data.cardCompany}</p>` : ''}
          
          <a href="${data.cardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Lihat & Simpan Kontak</a>
          <p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px;">Klik tombol di atas untuk melihat profil lengkap dan menyimpan kontak.</p>
       </div>

       ${data.message ? `
       <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #2563eb;">
         <p style="margin: 0; color: #1e40af; font-style: italic; font-size: 15px;">"${data.message}"</p>
       </div>` : ''}
     </div>

     <!-- Footer -->
     <div style="padding: 32px 24px; text-align: center; background-color: #f9fafb; border-top: 1px solid #f4f4f5;">
       <h4 style="margin: 0 0 8px; color: #111827; font-size: 16px; font-weight: 600;">Ingin memiliki kartu bisnis digital seperti ini?</h4>
       <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
         Buat profil profesional Anda dalam hitungan detik. Gratis dan mudah dibagikan!
       </p>
       <a href="https://official.id" style="display: inline-block; color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px;">Buat Kartu Digital Saya Sekarang &rarr;</a>
       
       <div style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
         <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Official ID. All rights reserved.</p>
       </div>
     </div>
  </div>
</body>
</html>
  `.trim()
}

export async function sendContactCardEmail(data: {
  recipientEmail: string
  recipientName: string
  senderName: string
  senderEmail: string
  cardName: string
  cardUrl: string
  message?: string
  cardPhotoUrl?: string
  cardJobTitle?: string
  cardCompany?: string
}): Promise<{ success: boolean; error?: string }> {

  const htmlContent = generateContactCardHtml({
    recipientName: data.recipientName,
    senderName: data.senderName,
    cardName: data.cardName,
    cardUrl: data.cardUrl,
    cardPhotoUrl: data.cardPhotoUrl,
    cardJobTitle: data.cardJobTitle,
    cardCompany: data.cardCompany,
    message: data.message
  })

  return sendEmailJS({
    to_email: data.recipientEmail,
    to_name: data.recipientName,
    from_name: data.senderName,
    from_email: data.senderEmail,
    subject: `Undangan Koneksi dari ${data.senderName}`,
    message: data.message || '', // Fallback text message
    message_html: htmlContent, // Rich HTML content
    card_url: data.cardUrl,
  }, EMAILJS_CONTACT_TEMPLATE_ID)
}
