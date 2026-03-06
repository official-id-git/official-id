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
                    <img
                        src={templateUrl}
                        alt="Template"
                        crossOrigin="anonymous"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0,
                        }}
                        onLoad={() => setIsReady(true)}
                    />

                    {/* Name */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${(fieldPositions.name.x / 400) * KTA_WIDTH_PX}px`,
                            top: `${(fieldPositions.name.y / 250) * KTA_HEIGHT_PX}px`,
                            width: `${(fieldPositions.name.width / 400) * KTA_WIDTH_PX}px`,
                            height: `${(fieldPositions.name.height / 250) * KTA_HEIGHT_PX}px`,
                            fontSize: `${fieldPositions.name.fontSize * (KTA_WIDTH_PX / 400)}px`,
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
                            left: `${(fieldPositions.kta_number.x / 400) * KTA_WIDTH_PX}px`,
                            top: `${(fieldPositions.kta_number.y / 250) * KTA_HEIGHT_PX}px`,
                            width: `${(fieldPositions.kta_number.width / 400) * KTA_WIDTH_PX}px`,
                            height: `${(fieldPositions.kta_number.height / 250) * KTA_HEIGHT_PX}px`,
                            fontSize: `${fieldPositions.kta_number.fontSize * (KTA_WIDTH_PX / 400)}px`,
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
                            left: `${(fieldPositions.photo.x / 400) * KTA_WIDTH_PX}px`,
                            top: `${(fieldPositions.photo.y / 250) * KTA_HEIGHT_PX}px`,
                            width: `${(fieldPositions.photo.width / 400) * KTA_WIDTH_PX}px`,
                            height: `${(fieldPositions.photo.height / 250) * KTA_HEIGHT_PX}px`,
                            backgroundColor: '#f3f4f6',
                            zIndex: 5,
                        }}
                    >
                        {userData.photoUrl && (
                            <img
                                src={userData.photoUrl}
                                crossOrigin="anonymous"
                                alt="Photo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        )}
                    </div>

                    {/* QR Code */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${(fieldPositions.qrcode.x / 400) * KTA_WIDTH_PX}px`,
                            top: `${(fieldPositions.qrcode.y / 250) * KTA_HEIGHT_PX}px`,
                            width: `${(fieldPositions.qrcode.width / 400) * KTA_WIDTH_PX}px`,
                            height: `${(fieldPositions.qrcode.height / 250) * KTA_HEIGHT_PX}px`,
                            backgroundColor: '#ffffff',
                            padding: '4px',
                            zIndex: 5,
                        }}
                    >
                        {userData.qrCodeDataUrl && (
                            <img
                                src={userData.qrCodeDataUrl}
                                alt="QR Code"
                                crossOrigin="anonymous"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
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
