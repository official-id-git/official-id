// KTA Card Generator Library
// File: /src/lib/kta-generator.ts
// Server-side KTA image composition and PDF generation

import { PDFDocument } from 'pdf-lib'

export interface FieldPosition {
    x: number
    y: number
    width: number
    height: number
    fontSize?: number
    fontColor?: string
}

export interface KTAFieldPositions {
    name: FieldPosition
    kta_number: FieldPosition
    photo: FieldPosition
    qrcode: FieldPosition
}

export interface KTAData {
    fullName: string
    ktaNumber: string
    photoUrl: string
    qrCodeDataUrl: string // base64 data URL from qrcode library
}

// KTA card dimensions: 8.7cm × 5.5cm at 300 DPI
const KTA_WIDTH_PX = Math.round(8.7 * 300 / 2.54)  // ~1028px
const KTA_HEIGHT_PX = Math.round(5.5 * 300 / 2.54) // ~650px

/**
 * Fetch image as buffer from URL
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${url}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
}

/**
 * Convert base64 data URL to buffer
 */
function dataUrlToBuffer(dataUrl: string): Buffer {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    return Buffer.from(base64Data, 'base64')
}

/**
 * Generate KTA card image as PNG buffer using Canvas API (OffscreenCanvas or canvas package)
 * This runs server-side and composites: template + name + KTA number + photo + QR code
 */
export async function generateKTAImage(
    templateUrl: string,
    fieldPositions: KTAFieldPositions,
    data: KTAData
): Promise<Buffer> {
    // Dynamically import canvas for server-side rendering
    // We use a try-catch approach to handle both environments
    let createCanvas: any, loadImage: any

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const canvasModule = require('canvas')
        createCanvas = canvasModule.createCanvas
        loadImage = canvasModule.loadImage
    } catch {
        // If canvas is not available, use a simpler approach with sharp or built-in
        // Fallback: generate a simple card without canvas
        console.warn('canvas module not available, using fallback generation')
        return generateKTAImageFallback(templateUrl, fieldPositions, data)
    }

    // Create canvas at KTA dimensions
    const canvas = createCanvas(KTA_WIDTH_PX, KTA_HEIGHT_PX)
    const ctx = canvas.getContext('2d')

    // 1. Draw template background
    try {
        const templateImage = await loadImage(templateUrl)
        ctx.drawImage(templateImage, 0, 0, KTA_WIDTH_PX, KTA_HEIGHT_PX)
    } catch (err) {
        console.error('Failed to load template image:', err)
        // Fill with white background as fallback
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, KTA_WIDTH_PX, KTA_HEIGHT_PX)
    }

    // Scale factor: field positions are stored relative to a preview
    // The frontend template editor uses a fixed 496x312 preview box.
    const PREVIEW_WIDTH = 496
    const PREVIEW_HEIGHT = 312
    const scaleX = KTA_WIDTH_PX / PREVIEW_WIDTH
    const scaleY = KTA_HEIGHT_PX / PREVIEW_HEIGHT

    // 2. Draw name
    const namePos = fieldPositions.name
    const nameFontSize = (namePos.fontSize || 16) * scaleX
    ctx.fillStyle = namePos.fontColor || '#000000'
    ctx.font = `bold ${nameFontSize}px Arial, sans-serif`
    ctx.textBaseline = 'top'

    // Word wrap name if needed
    const nameX = namePos.x * scaleX
    const nameY = namePos.y * scaleY
    const nameMaxWidth = namePos.width * scaleX
    wrapText(ctx, data.fullName, nameX, nameY, nameMaxWidth, nameFontSize * 1.2)

    // 3. Draw KTA number
    const numPos = fieldPositions.kta_number
    const numFontSize = (numPos.fontSize || 12) * scaleX
    ctx.fillStyle = numPos.fontColor || '#333333'
    ctx.font = `${numFontSize}px Arial, sans-serif`
    ctx.fillText(
        data.ktaNumber,
        numPos.x * scaleX,
        numPos.y * scaleY,
        numPos.width * scaleX
    )

    // 4. Draw photo
    try {
        const photoImage = await loadImage(data.photoUrl)
        const photoX = fieldPositions.photo.x * scaleX
        const photoY = fieldPositions.photo.y * scaleY
        const photoW = fieldPositions.photo.width * scaleX
        const photoH = fieldPositions.photo.height * scaleY

        // Draw with rounded corners effect (clip)
        ctx.save()
        const radius = 8 * scaleX
        ctx.beginPath()
        ctx.moveTo(photoX + radius, photoY)
        ctx.lineTo(photoX + photoW - radius, photoY)
        ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + radius)
        ctx.lineTo(photoX + photoW, photoY + photoH - radius)
        ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - radius, photoY + photoH)
        ctx.lineTo(photoX + radius, photoY + photoH)
        ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - radius)
        ctx.lineTo(photoX, photoY + radius)
        ctx.quadraticCurveTo(photoX, photoY, photoX + radius, photoY)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(photoImage, photoX, photoY, photoW, photoH)
        ctx.restore()
    } catch (err) {
        console.error('Failed to load photo:', err)
    }

    // 5. Draw QR code
    try {
        const qrBuffer = dataUrlToBuffer(data.qrCodeDataUrl)
        const qrImage = await loadImage(qrBuffer)
        ctx.drawImage(
            qrImage,
            fieldPositions.qrcode.x * scaleX,
            fieldPositions.qrcode.y * scaleY,
            fieldPositions.qrcode.width * scaleX,
            fieldPositions.qrcode.height * scaleY
        )
    } catch (err) {
        console.error('Failed to load QR code:', err)
    }

    // Export as PNG buffer
    return canvas.toBuffer('image/png')
}

/**
 * Fallback KTA image generation without canvas module
 * Creates a simple representation as a placeholder
 */
async function generateKTAImageFallback(
    templateUrl: string,
    _fieldPositions: KTAFieldPositions,
    _data: KTAData
): Promise<Buffer> {
    // Simply download the template as fallback
    return fetchImageBuffer(templateUrl)
}

/**
 * Word wrap text on canvas
 */
function wrapText(
    ctx: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(' ')
    let line = ''
    let currentY = y

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' '
        const metrics = ctx.measureText(testLine)
        const testWidth = metrics.width

        if (testWidth > maxWidth && i > 0) {
            ctx.fillText(line.trim(), x, currentY)
            line = words[i] + ' '
            currentY += lineHeight
        } else {
            line = testLine
        }
    }
    ctx.fillText(line.trim(), x, currentY)
}

/**
 * Generate PDF from KTA image buffer
 */
export async function generateKTAPDF(imageBuffer: Buffer): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()

    // KTA card size: 8.7cm × 5.5cm → convert to points (1cm = 28.3465 points)
    const widthPt = 8.7 * 28.3465
    const heightPt = 5.5 * 28.3465

    const page = pdfDoc.addPage([widthPt, heightPt])

    // Embed the PNG image
    const pngImage = await pdfDoc.embedPng(imageBuffer)

    // Draw image to fill the entire page
    page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: widthPt,
        height: heightPt,
    })

    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
}

export { KTA_WIDTH_PX, KTA_HEIGHT_PX }
