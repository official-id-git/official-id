'use client'

import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as htmlToImage from 'html-to-image'
import { PDFDocument } from 'pdf-lib'

interface KTAFieldPositions {
    name: { x: number; y: number; width: number; height: number; fontSize: number; fontColor: string }
    kta_number: { x: number; y: number; width: number; height: number; fontSize: number; fontColor: string }
    photo: { x: number; y: number; width: number; height: number }
    qrcode: { x: number; y: number; width: number; height: number }
}

interface KTACardGeneratorProps {
    templateUrl: string
    fieldPositions: KTAFieldPositions
    userData: {
        fullName: string
        ktaNumber: string
        photoUrl: string
        qrCodeDataUrl: string
    }
}

export interface KTACardGeneratorRef {
    generateFiles: () => Promise<{ base64Image: string; base64Pdf: string } | null>
}

// 8.7cm x 5.5cm ≈ 870px x 550px for high-res generation
const KTA_WIDTH_PX = 870
const KTA_HEIGHT_PX = 550

// These MUST match PREVIEW_WIDTH and PREVIEW_HEIGHT in the template editor
// (src/app/dashboard/organizations/[id]/kta/page.tsx)
// Field positions are saved in this coordinate system by the drag editor.
const PREVIEW_BASE_WIDTH = 496
const PREVIEW_BASE_HEIGHT = 312

const KTACardGenerator = forwardRef<KTACardGeneratorRef, KTACardGeneratorProps>(
    ({ templateUrl, fieldPositions, userData }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null)
        const [isReady, setIsReady] = useState(false)

        useImperativeHandle(ref, () => ({
            generateFiles: async () => {
                if (!containerRef.current) return null

                try {
                    // 1. Generate PNG base64
                    const dataUrl = await htmlToImage.toPng(containerRef.current, {
                        quality: 0.9,
                        width: KTA_WIDTH_PX,
                        height: KTA_HEIGHT_PX,
                        pixelRatio: 2, // Double resolution for crispy text
                        cacheBust: true, // Fix tainted canvas issues with external images
                        backgroundColor: '#ffffff'
                    })

                    // 2. Generate PDF using pdf-lib
                    const pdfDoc = await PDFDocument.create()
                    const widthPt = 8.7 * 28.3465 // cm to points
                    const heightPt = 5.5 * 28.3465
                    const page = pdfDoc.addPage([widthPt, heightPt])

                    // Remove data URI prefix for pdf-lib
                    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
                    const imgBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

                    const pngImage = await pdfDoc.embedPng(imgBuffer)
                    page.drawImage(pngImage, {
                        x: 0,
                        y: 0,
                        width: widthPt,
                        height: heightPt,
                    })

                    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true })

                    return {
                        base64Image: dataUrl,
                        base64Pdf: pdfBytes,
                    }
                } catch (error) {
                    console.error('Failed to generate KTA files:', error)
                    return null
                }
            }
        }))

        // Scale helpers — convert from editor coords to generation coords
        const scaleX = (val: number) => (val / PREVIEW_BASE_WIDTH) * KTA_WIDTH_PX
        const scaleY = (val: number) => (val / PREVIEW_BASE_HEIGHT) * KTA_HEIGHT_PX

        // We render it completely off-screen but in the DOM so html-to-image can capture it
        return (
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
                <div
                    ref={containerRef}
                    style={{
                        width: `${KTA_WIDTH_PX}px`,
                        height: `${KTA_HEIGHT_PX}px`,
                        position: 'relative',
                        backgroundColor: '#ffffff',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background Template */}
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0,
                            backgroundImage: `url(${templateUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* We use an invisible image just to safely track onload for the promise if needed, 
                            though backgroundImage loading can be trickier, we'll keep the onload logic simple */}
                        <img
                            src={templateUrl}
                            style={{ display: 'none' }}
                            onLoad={() => setIsReady(true)}
                            alt=""
                            crossOrigin="anonymous"
                        />
                    </div>

                    {/* Name */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${scaleX(fieldPositions.name.x)}px`,
                            top: `${scaleY(fieldPositions.name.y)}px`,
                            width: `${scaleX(fieldPositions.name.width)}px`,
                            height: `${scaleY(fieldPositions.name.height)}px`,
                            fontSize: `${fieldPositions.name.fontSize * (KTA_WIDTH_PX / PREVIEW_BASE_WIDTH)}px`,
                            color: fieldPositions.name.fontColor,
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 10,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                        }}
                    >
                        {userData.fullName}
                    </div>

                    {/* KTA Number */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${scaleX(fieldPositions.kta_number.x)}px`,
                            top: `${scaleY(fieldPositions.kta_number.y)}px`,
                            width: `${scaleX(fieldPositions.kta_number.width)}px`,
                            height: `${scaleY(fieldPositions.kta_number.height)}px`,
                            fontSize: `${fieldPositions.kta_number.fontSize * (KTA_WIDTH_PX / PREVIEW_BASE_WIDTH)}px`,
                            color: fieldPositions.kta_number.fontColor,
                            fontFamily: 'monospace',
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 10,
                        }}
                    >
                        {userData.ktaNumber}
                    </div>

                    {/* Photo */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${scaleX(fieldPositions.photo.x)}px`,
                            top: `${scaleY(fieldPositions.photo.y)}px`,
                            width: `${scaleX(fieldPositions.photo.width)}px`,
                            height: `${scaleY(fieldPositions.photo.height)}px`,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            backgroundColor: '#f3f4f6',
                            boxShadow: '0 0 0 4px rgba(255,255,255,0.8), 0 2px 12px rgba(0,0,0,0.18)',
                            zIndex: 5,
                        }}
                    >
                        {userData.photoUrl && (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${userData.photoUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: '#e5e7eb',
                                }}
                            />
                        )}
                    </div>

                    {/* QR Code */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${scaleX(fieldPositions.qrcode.x)}px`,
                            top: `${scaleY(fieldPositions.qrcode.y)}px`,
                            width: `${scaleX(fieldPositions.qrcode.width)}px`,
                            height: `${scaleY(fieldPositions.qrcode.height)}px`,
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            padding: '6px',
                            boxShadow: '0 1px 8px rgba(0,0,0,0.12)',
                            zIndex: 5,
                        }}
                    >
                        {userData.qrCodeDataUrl && (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${userData.qrCodeDataUrl})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        )
    }
)

KTACardGenerator.displayName = 'KTACardGenerator'

export default KTACardGenerator
