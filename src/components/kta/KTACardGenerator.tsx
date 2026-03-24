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

        // State to hold base64 versions of images for rendering
        const [templateBase64, setTemplateBase64] = useState<string>('')
        const [photoBase64, setPhotoBase64] = useState<string>('')
        const [qrBase64, setQrBase64] = useState<string>('')

        useImperativeHandle(ref, () => ({
            generateFiles: async () => {
                if (!containerRef.current) return null

                try {
                    // Helper: fetch external URL via proxy and convert to base64 data URL
                    const fetchToBase64 = async (url: string): Promise<string> => {
                        if (!url) return '';
                        if (url.startsWith('data:')) return url;
                        const fetchUrl = url.startsWith('http')
                            ? `/api/kta/proxy-image?url=${encodeURIComponent(url)}`
                            : url;
                        console.log('[KTA Gen] Fetching:', fetchUrl.substring(0, 120));
                        const res = await fetch(fetchUrl);
                        if (!res.ok) throw new Error(`Proxy fetch failed (${res.status})`);
                        const blob = await res.blob();
                        console.log(`[KTA Gen] Blob: ${blob.size} bytes, ${blob.type}`);
                        return new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = () => reject(new Error('FileReader failed'));
                            reader.readAsDataURL(blob);
                        });
                    }

                    // 1. Pre-fetch ALL images to base64 in parallel
                    console.log('[KTA Gen] Pre-fetching all images to base64...');
                    const [b64Template, b64Photo, b64Qr] = await Promise.all([
                        fetchToBase64(templateUrl),
                        fetchToBase64(userData.photoUrl),
                        Promise.resolve(userData.qrCodeDataUrl), // Already base64
                    ]);

                    console.log(`[KTA Gen] Template base64: ${b64Template ? b64Template.length : 0} chars`);
                    console.log(`[KTA Gen] Photo base64: ${b64Photo ? b64Photo.length : 0} chars`);
                    console.log(`[KTA Gen] QR base64: ${b64Qr ? b64Qr.length : 0} chars`);

                    // 2. Set base64 into state so React re-renders <img> tags with inline data
                    setTemplateBase64(b64Template);
                    setPhotoBase64(b64Photo);
                    setQrBase64(b64Qr);

                    // 3. Wait for React to flush + browser to render <img> elements
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // 4. Verify all <img> tags inside container have loaded
                    const allImgs = containerRef.current!.querySelectorAll('img');
                    console.log(`[KTA Gen] Found ${allImgs.length} img tags in container`);
                    for (const img of Array.from(allImgs)) {
                        if (img.src && !img.complete) {
                            console.log(`[KTA Gen] Waiting for img to load: ${img.src.substring(0, 60)}...`);
                            await new Promise<void>((resolve) => {
                                img.onload = () => resolve();
                                img.onerror = () => { console.warn('[KTA Gen] img load error'); resolve(); };
                                // Safety timeout
                                setTimeout(() => resolve(), 3000);
                            });
                        }
                    }

                    // Extra paint delay
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // 5. Use html-to-image to capture — with retry
                    let dataUrl = '';
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        try {
                            console.log(`[KTA Gen] Capturing attempt ${attempt}/3...`);
                            dataUrl = await htmlToImage.toPng(containerRef.current!, {
                                quality: 0.95,
                                width: KTA_WIDTH_PX,
                                height: KTA_HEIGHT_PX,
                                pixelRatio: 2,
                                cacheBust: true,
                                backgroundColor: '#ffffff',
                            });
                            // Validate: a proper card image should be at least ~10KB as base64
                            if (dataUrl && dataUrl.length > 15000) {
                                console.log(`[KTA Gen] Capture OK (attempt ${attempt}), size: ${dataUrl.length} chars`);
                                break;
                            }
                            console.warn(`[KTA Gen] Capture too small (${dataUrl.length}), retrying...`);
                        } catch (err) {
                            console.error(`[KTA Gen] Capture error (attempt ${attempt}):`, err);
                            if (attempt === 3) throw err;
                        }
                        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
                    }

                    if (!dataUrl || dataUrl.length < 5000) {
                        throw new Error(`Capture result too small or empty (${dataUrl?.length || 0} chars)`);
                    }

                    // 6. Generate PDF
                    const pdfDoc = await PDFDocument.create()
                    const widthPt = 8.7 * 28.3465
                    const heightPt = 5.5 * 28.3465
                    const page = pdfDoc.addPage([widthPt, heightPt])

                    const pngData = dataUrl.replace(/^data:image\/png;base64,/, '')
                    const imgBuffer = Uint8Array.from(atob(pngData), c => c.charCodeAt(0))

                    const pngImage = await pdfDoc.embedPng(imgBuffer)
                    page.drawImage(pngImage, { x: 0, y: 0, width: widthPt, height: heightPt })

                    const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true })

                    return { base64Image: dataUrl, base64Pdf: pdfBytes }
                } catch (error) {
                    console.error('[KTA Gen] FAILED:', error)
                    return null
                }
            }
        }))

        // Scale helpers — convert from editor coords to generation coords
        const scaleX = (val: number) => (val / PREVIEW_BASE_WIDTH) * KTA_WIDTH_PX
        const scaleY = (val: number) => (val / PREVIEW_BASE_HEIGHT) * KTA_HEIGHT_PX

        // Determine which src to use: base64 (during capture) or proxy (initial render)
        const getProxyUrl = (url: string | undefined | null) => {
            if (!url) return '';
            if (url.startsWith('data:') || url.startsWith('/')) return url;
            return `/api/kta/proxy-image?url=${encodeURIComponent(url)}`;
        };

        const templateSrc = templateBase64 || getProxyUrl(templateUrl);
        const photoSrc = photoBase64 || getProxyUrl(userData.photoUrl);
        const qrSrc = qrBase64 || userData.qrCodeDataUrl;

        // IMPORTANT: We use <img> tags instead of CSS background-image because
        // html-to-image serializes DOM → SVG foreignObject → Canvas.
        // CSS background-image with large base64 data URLs FAILS SILENTLY in this pipeline.
        // <img> tags are handled correctly by html-to-image.
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
                    {/* Background Template — using <img> tag */}
                    {templateSrc && (
                        <img
                            src={templateSrc}
                            alt=""
                            crossOrigin="anonymous"
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                zIndex: 0,
                                objectFit: 'cover',
                            }}
                        />
                    )}

                    {/* Name */}
                    <div
                        style={{
                            position: 'absolute',
                            left: `${scaleX(fieldPositions.name.x)}px`,
                            top: `${scaleY(fieldPositions.name.y)}px`,
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

                    {/* Photo — using <img> tag inside rounded container */}
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
                        {photoSrc && (
                            <img
                                src={photoSrc}
                                alt=""
                                crossOrigin="anonymous"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        )}
                    </div>

                    {/* QR Code — using <img> tag */}
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
                        {qrSrc && (
                            <img
                                src={qrSrc}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    display: 'block',
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
