// Card Download Utility - Generate Card as Image
// File: /src/lib/card-download.ts

import type { BusinessCard } from '@/types'

/**
 * Generate business card as downloadable image
 */
export async function downloadCardAsImage(
  card: BusinessCard,
  filename: string = 'kartu-bisnis'
): Promise<void> {
  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  // Card dimensions (standard business card ratio 3.5:2)
  const width = 700
  const height = 450
  canvas.width = width
  canvas.height = height

  // Background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  // Add subtle border
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, width - 2, height - 2)

  // Left accent bar
  ctx.fillStyle = '#2563EB'
  ctx.fillRect(0, 0, 8, height)

  // Load profile photo if exists
  let photoLoaded = false
  if (card.profile_photo_url) {
    try {
      const img = await loadImage(card.profile_photo_url)
      // Draw circular photo
      ctx.save()
      ctx.beginPath()
      ctx.arc(80, 100, 50, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, 30, 50, 100, 100)
      ctx.restore()
      
      // Add circle border
      ctx.strokeStyle = '#E5E7EB'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(80, 100, 50, 0, Math.PI * 2)
      ctx.stroke()
      
      photoLoaded = true
    } catch (e) {
      console.log('Could not load profile photo')
    }
  }

  // Draw initial circle if no photo
  if (!photoLoaded) {
    ctx.fillStyle = '#DBEAFE'
    ctx.beginPath()
    ctx.arc(80, 100, 50, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#2563EB'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(card.full_name.charAt(0).toUpperCase(), 80, 100)
  }

  // Reset text alignment
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  // Name
  ctx.fillStyle = '#111827'
  ctx.font = 'bold 28px Arial'
  ctx.fillText(card.full_name, 150, 60)

  // Job title
  if (card.job_title) {
    ctx.fillStyle = '#2563EB'
    ctx.font = 'italic 18px Arial'
    ctx.fillText(card.job_title, 150, 95)
  }

  // Company
  if (card.company) {
    ctx.fillStyle = '#6B7280'
    ctx.font = '16px Arial'
    ctx.fillText(card.company, 150, 125)
  }

  // Divider line
  ctx.strokeStyle = '#E5E7EB'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(30, 180)
  ctx.lineTo(450, 180)
  ctx.stroke()

  // Get visible fields
  const visibleFields = (card.visible_fields as Record<string, boolean>) || { 
    email: true, 
    phone: true, 
    website: true,
    social_links: true 
  }

  // Contact info section
  let yPos = 200
  const leftMargin = 40

  // Email
  if (visibleFields.email !== false) {
    ctx.fillStyle = '#4B5563'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('E', leftMargin, yPos)
    ctx.fillStyle = '#111827'
    ctx.font = '14px Arial'
    ctx.fillText(card.email, leftMargin + 30, yPos)
    yPos += 28
  }

  // Phone
  if (visibleFields.phone !== false) {
    ctx.fillStyle = '#4B5563'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('M', leftMargin, yPos)
    ctx.fillStyle = '#111827'
    ctx.font = '14px Arial'
    ctx.fillText(card.phone, leftMargin + 30, yPos)
    yPos += 28
  }

  // Website
  if (visibleFields.website !== false && card.website) {
    ctx.fillStyle = '#4B5563'
    ctx.font = 'bold 14px Arial'
    ctx.fillText('W', leftMargin, yPos)
    ctx.fillStyle = '#111827'
    ctx.font = '14px Arial'
    ctx.fillText(card.website, leftMargin + 30, yPos)
    yPos += 28
  }

  // Social Media Links - ONLY if checkbox is checked
  if (visibleFields.social_links === true) {
    const socialLinks = (card.social_links as Record<string, string>) || {}
    const activeSocials = Object.entries(socialLinks).filter(([_, url]) => url && url.trim() !== '')
    
    if (activeSocials.length > 0) {
      // Social media divider
      yPos += 5
      ctx.strokeStyle = '#E5E7EB'
      ctx.beginPath()
      ctx.moveTo(30, yPos)
      ctx.lineTo(450, yPos)
      ctx.stroke()
      yPos += 15

      // Draw social links in rows
      let xPos = leftMargin
      const maxWidth = 420
      
      for (const [platform, url] of activeSocials) {
        const displayText = `${getPlatformLabel(platform)}: ${getUsername(url as string)}`
        const textWidth = ctx.measureText(displayText).width + 20

        // Check if need new line
        if (xPos + textWidth > maxWidth) {
          xPos = leftMargin
          yPos += 22
        }

        // Draw platform badge
        ctx.fillStyle = getPlatformColor(platform)
        ctx.font = 'bold 11px Arial'
        ctx.fillText(getPlatformLabel(platform), xPos, yPos)
        
        // Draw username
        ctx.fillStyle = '#374151'
        ctx.font = '11px Arial'
        const labelWidth = ctx.measureText(getPlatformLabel(platform)).width
        ctx.fillText(': ' + getUsername(url as string), xPos + labelWidth, yPos)

        xPos += textWidth
      }
    }
  }

  // QR Code (if exists)
  if (card.qr_code_url) {
    try {
      const qrImg = await loadImage(card.qr_code_url)
      // Draw QR code on right side
      ctx.drawImage(qrImg, width - 150, 50, 120, 120)
      
      // QR label
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Scan untuk menyimpan', width - 90, 180)
    } catch (e) {
      console.log('Could not load QR code')
    }
  }

  // Footer - branding
  ctx.fillStyle = '#9CA3AF'
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  ctx.fillText('Powered by Official ID', width - 20, height - 15)

  // Download
  const dataUrl = canvas.toDataURL('image/png', 1.0)
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Get platform color
 */
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    linkedin: '#0A66C2',
    twitter: '#000000',
    instagram: '#E4405F',
    facebook: '#1877F2',
    github: '#181717',
    youtube: '#FF0000',
    tiktok: '#000000',
  }
  return colors[platform.toLowerCase()] || '#6B7280'
}

/**
 * Get platform label
 */
function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    linkedin: 'LinkedIn',
    twitter: 'X',
    instagram: 'IG',
    facebook: 'FB',
    github: 'GitHub',
    youtube: 'YT',
    tiktok: 'TikTok',
  }
  return labels[platform.toLowerCase()] || platform
}

/**
 * Extract username from URL
 */
function getUsername(url: string): string {
  try {
    const urlObj = new URL(url)
    let path = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '')
    
    // Handle LinkedIn /in/username
    if (path.startsWith('in/')) {
      path = path.replace('in/', '')
    }
    
    // Handle @ prefix
    if (!path.startsWith('@') && path) {
      path = '@' + path.split('/')[0]
    }
    
    return path || url
  } catch {
    return url.length > 15 ? url.substring(0, 12) + '...' : url
  }
}

/**
 * Load image as Promise
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Download QR code only
 */
export async function downloadQRCodeOnly(
  qrCodeUrl: string,
  filename: string = 'qrcode'
): Promise<void> {
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = qrCodeUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}