import QRCode from 'qrcode'

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(url: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
    return dataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Gagal membuat QR code')
  }
}

/**
 * Generate QR code as canvas element
 */
export async function generateQRCodeCanvas(
  canvas: HTMLCanvasElement,
  url: string
): Promise<void> {
  try {
    await QRCode.toCanvas(canvas, url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
  } catch (error) {
    console.error('Error generating QR code canvas:', error)
    throw new Error('Gagal membuat QR code')
  }
}

/**
 * Download QR code as PNG image
 */
export async function downloadQRCode(url: string, filename: string): Promise<void> {
  try {
    const dataUrl = await generateQRCode(url)
    
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading QR code:', error)
    throw new Error('Gagal mengunduh QR code')
  }
}

/**
 * Get public card URL
 */
export function getPublicCardUrl(cardId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/c/${cardId}`
}
