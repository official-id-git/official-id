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

        const getProxyUrl = (url: string | undefined | null) => {
            if (!url) return '';
            if (url.startsWith('data:') || url.startsWith('/')) return url;
            return `/api/kta/proxy-image?url=${encodeURIComponent(url)}`;
        };

        const safeTemplateUrl = getProxyUrl(templateUrl);
        const safePhotoUrl = getProxyUrl(userData.photoUrl);

        useImperativeHandle(ref, () => ({
            generateFiles: async () => {
                if (!containerRef.current) return null

                try {
                    // Force synchronous pre-fetch to Base64 to guarantee availability before capture
                    const fetchToBase64 = async (url: string): Promise<string> => {
                        if (!url || url.startsWith('data:')) return url;
                        const fetchUrl = url.startsWith('http') ? `/api/kta/proxy-image?url=${encodeURIComponent(url)}` : url;
                        console.log('[KTA Generator] Fetching image to base64:', fetchUrl.substring(0, 100));
                        const res = await fetch(fetchUrl);
                        if (!res.ok) throw new Error(`Proxy fetch failed (${res.status}): ${fetchUrl.substring(0, 100)}`);
                        const blob = await res.blob();
                        console.log(`[KTA Generator] Got blob: ${blob.size} bytes, type: ${blob.type}`);
                        return new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error('FileReader failed'));
                            reader.readAsDataURL(blob);
                        });
                    }

                    // Pre-fetch both images to base64 — fail loudly if either fails
                    console.log('[KTA Generator] Pre-fetching template and photo...');
                    const [base64Template, base64Photo] = await Promise.all([
                        fetchToBase64(templateUrl),
                        fetchToBase64(userData.photoUrl),
                    ]);

                    if (!base64Template || !base64Template.startsWith('data:')) {
                        console.error('[KTA Generator] Template fetch failed — got:', base64Template?.substring(0, 50));
                    }
                    if (!base64Photo || !base64Photo.startsWith('data:')) {
                        console.error('[KTA Generator] Photo fetch failed — got:', base64Photo?.substring(0, 50));
                    }

                    // Inject base64 directly to DOM nodes (bypassing React re-render)
                    const templateDiv = containerRef.current.querySelector('.kta-template-bg') as HTMLDivElement;
                    const photoDiv = containerRef.current.querySelector('.kta-user-photo') as HTMLDivElement;

                    if (templateDiv && base64Template) templateDiv.style.backgroundImage = `url(${base64Template})`;
                    if (photoDiv && base64Photo) photoDiv.style.backgroundImage = `url(${base64Photo})`;

                    // Wait for browser to decode the injected images before capture
                    const waitForImageDecode = async (dataUrl: string) => {
                        if (!dataUrl || !dataUrl.startsWith('data:')) return;
                        const img = new Image();
                        img.src = dataUrl;
                        try {
                            await img.decode();
                        } catch {
                            // decode() may fail for some formats, continue anyway
                            console.warn('[KTA Generator] Image decode() failed, continuing...');
                        }
                    };

                    await Promise.all([
                        waitForImageDecode(base64Template),
                        waitForImageDecode(base64Photo),
                    ]);

                    // Extra delay to ensure browser paint cycle has completed
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // 1. Generate PNG base64 with retry logic
                    let dataUrl = '';
                    const maxRetries = 3;
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            console.log(`[KTA Generator] html-to-image attempt ${attempt}/${maxRetries}...`);
                            dataUrl = await htmlToImage.toPng(containerRef.current!, {
                                quality: 0.95,
                                width: KTA_WIDTH_PX,
                                height: KTA_HEIGHT_PX,
                                pixelRatio: 2,
                                cacheBust: true,
                                backgroundColor: '#ffffff',
                            });
                            if (dataUrl && dataUrl.length > 1000) {
                                console.log(`[KTA Generator] Capture success on attempt ${attempt}, size: ${dataUrl.length}`);
                                break;
                            }
                            console.warn(`[KTA Generator] Capture returned suspiciously small result (${dataUrl.length}), retrying...`);
                        } catch (err) {
                            console.error(`[KTA Generator] Capture attempt ${attempt} failed:`, err);
                            if (attempt === maxRetries) throw err;
                        }
                        // Wait between retries
                        await new Promise(resolve => setTimeout(resolve, 300 * attempt));
                    }

                    if (!dataUrl) throw new Error('html-to-image capture returned empty result');

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
                    console.error('[KTA Generator] Failed to generate KTA files:', error)
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
                        className="kta-template-bg"
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 0,
                            backgroundImage: `url(${safeTemplateUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* We use an invisible image just to safely track onload for the promise if needed, 
                            though backgroundImage loading can be trickier, we'll keep the onload logic simple */}
                        <img
                            src={safeTemplateUrl}
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
                            // Add +150px (≈10 extra chars) beyond the template-defined width so long names aren't clipped
                            width: `${scaleX(fieldPositions.name.width) + 150}px`,
                            height: `${scaleY(fieldPositions.name.height)}px`,
                            fontSize: `${fieldPositions.name.fontSize * (KTA_WIDTH_PX / PREVIEW_BASE_WIDTH)}px`,
                            color: fieldPositions.name.fontColor,
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 10,
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
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
                            borderRadius: '18px',
                            overflow: 'hidden',
                            backgroundColor: '#f3f4f6',
                            boxShadow: '0 0 0 3px rgba(255,255,255,0.85), 0 2px 14px rgba(0,0,0,0.2)',
                            zIndex: 5,
                        }}
                    >
                        {safePhotoUrl && (
                            <div
                                className="kta-user-photo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: `url(${safePhotoUrl})`,
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
