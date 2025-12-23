import type { BusinessCard } from '@/types'

// Business card dimensions (credit card size: 85.6mm x 53.98mm)
// At 300 DPI: 1011px x 638px
const CARD_WIDTH = 1011
const CARD_HEIGHT = 638

const BACKGROUND_URL = 'https://res.cloudinary.com/dhr9kt7r5/image/upload/v1766407399/background_template01_vxcvhk.png'

// Load Google Font (Poppins - bold minimalist)
async function loadFont(): Promise<void> {
  const font = new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2)')
  const fontBold = new FontFace('Poppins', 'url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2)', { weight: '700' })
  
  try {
    await Promise.all([font.load(), fontBold.load()])
    document.fonts.add(font)
    document.fonts.add(fontBold)
  } catch (e) {
    console.log('Font load failed, using fallback')
  }
}

export async function downloadBusinessCard(card: BusinessCard): Promise<void> {
  // Load font first
  await loadFont()
  
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Canvas not supported')
  }

  // Draw card design
  await drawBusinessCard(ctx, card)

  // Download
  const link = document.createElement('a')
  link.download = `kartu-nama-${card.full_name.replace(/\s+/g, '-').toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

async function drawBusinessCard(ctx: CanvasRenderingContext2D, card: BusinessCard): Promise<void> {
  // Load and draw background
  try {
    const bgImg = await loadImage(BACKGROUND_URL)
    ctx.drawImage(bgImg, 0, 0, CARD_WIDTH, CARD_HEIGHT)
  } catch (e) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  }

  const textBlack = '#1a1a1a'
  const white = '#FFFFFF'

  // === TOP LEFT: Name & Job Title (moved down below light blue graphic) ===
  ctx.fillStyle = textBlack
  ctx.font = 'bold 44px Poppins, Arial, sans-serif'
  ctx.fillText(card.full_name, 50, 160)

  ctx.font = '600 26px Poppins, Arial, sans-serif'
  ctx.fillText(card.job_title || '', 50, 200)

  // === TOP RIGHT: QR Code ===
  const qrX = CARD_WIDTH - 180
  const qrY = 30
  const qrSize = 140

  if (card.qr_code_url) {
    try {
      const qrImg = await loadImage(card.qr_code_url)
      ctx.fillStyle = white
      ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10)
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)
    } catch (e) {
      console.log('QR load failed')
    }
  }

  // === BOTTOM LEFT: Profile Photo ===
  const photoX = 160
  const photoY = 400
  const photoRadius = 90

  // White circle background
  ctx.beginPath()
  ctx.arc(photoX, photoY, photoRadius + 6, 0, Math.PI * 2)
  ctx.fillStyle = white
  ctx.fill()

  if (card.profile_photo_url) {
    try {
      const img = await loadImage(card.profile_photo_url)
      ctx.save()
      ctx.beginPath()
      ctx.arc(photoX, photoY, photoRadius, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, photoX - photoRadius, photoY - photoRadius, photoRadius * 2, photoRadius * 2)
      ctx.restore()
    } catch (e) {
      drawInitials(ctx, photoX, photoY, photoRadius, card.full_name, textBlack)
    }
  } else {
    drawInitials(ctx, photoX, photoY, photoRadius, card.full_name, textBlack)
  }

  // === RIGHT SIDE: Contact Info (black text, bold minimalist) ===
  const infoRightEdge = CARD_WIDTH - 50
  const startY = 320
  const lineHeight = 45

  ctx.textAlign = 'right'

  // Company/Address - with icon
  drawContactRow(ctx, card.company || '-', infoRightEdge, startY, 'location', textBlack)
  
  // Phone
  drawContactRow(ctx, card.phone, infoRightEdge, startY + lineHeight, 'phone', textBlack)
  
  // Email
  drawContactRow(ctx, card.email, infoRightEdge, startY + lineHeight * 2, 'email', textBlack)
  
  // Website
  const website = card.website ? card.website.replace(/^https?:\/\//, '') : '-'
  drawContactRow(ctx, website, infoRightEdge, startY + lineHeight * 3, 'website', textBlack)

  ctx.textAlign = 'left'
}

function drawContactRow(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  rightEdge: number, 
  y: number,
  iconType: string,
  color: string
) {
  const iconSize = 20
  const iconGap = 12
  
  // Truncate long text
  const maxLen = 30
  const displayText = text.length > maxLen ? text.substring(0, maxLen - 2) + '..' : text

  // Draw text (bold minimalist)
  ctx.fillStyle = color
  ctx.font = '600 20px Poppins, Arial, sans-serif'
  
  // Measure text to position icon
  const textWidth = ctx.measureText(displayText).width
  const textX = rightEdge - iconSize - iconGap
  
  ctx.fillText(displayText, textX, y)

  // Draw icon after text
  const iconX = rightEdge - iconSize / 2
  drawIcon(ctx, iconType, iconX, y - 14, color, iconSize)
}

function drawInitials(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  name: string,
  color: string
) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = '#E5E7EB'
  ctx.fill()
  
  ctx.fillStyle = color
  ctx.font = 'bold 52px Poppins, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name.charAt(0).toUpperCase(), x, y)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawIcon(
  ctx: CanvasRenderingContext2D, 
  type: string, 
  x: number, 
  y: number, 
  color: string,
  size: number
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const s = size / 24

  switch (type) {
    case 'location':
      // MapPin icon
      ctx.beginPath()
      ctx.arc(x, y + 7 * s, 2.5 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x, y + 20 * s)
      ctx.lineTo(x - 7 * s, y + 7 * s)
      ctx.arc(x, y + 7 * s, 7 * s, Math.PI, 0, true)
      ctx.lineTo(x, y + 20 * s)
      ctx.stroke()
      break

    case 'phone':
      // Phone icon
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x - 7 * s, y + 18 * s)
      ctx.lineTo(x - 4 * s, y + 14 * s)
      ctx.lineTo(x - 4 * s, y + 10 * s)
      ctx.lineTo(x - 7 * s, y + 7 * s)
      ctx.quadraticCurveTo(x - 2 * s, y + 2 * s, x + 3 * s, y + 7 * s)
      ctx.lineTo(x, y + 10 * s)
      ctx.lineTo(x + 4 * s, y + 10 * s)
      ctx.lineTo(x + 7 * s, y + 14 * s)
      ctx.quadraticCurveTo(x + 2 * s, y + 19 * s, x - 3 * s, y + 14 * s)
      ctx.stroke()
      break

    case 'email':
      // Mail icon
      const mw = 9 * s
      const mh = 6 * s
      ctx.strokeRect(x - mw, y + 3 * s, mw * 2, mh * 2)
      ctx.beginPath()
      ctx.moveTo(x - mw, y + 3 * s)
      ctx.lineTo(x, y + 10 * s)
      ctx.lineTo(x + mw, y + 3 * s)
      ctx.stroke()
      break

    case 'website':
      // Globe icon
      const r = 8 * s
      ctx.beginPath()
      ctx.arc(x, y + 10 * s, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(x - r, y + 10 * s)
      ctx.lineTo(x + r, y + 10 * s)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(x, y + 10 * s, r * 0.4, r, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
  }

  ctx.restore()
}
