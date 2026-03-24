import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const parsedUrl = new URL(url);

        // 1. Only allow HTTPS
        if (parsedUrl.protocol !== 'https:') {
            return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 });
        }

        // 2. Whitelist allowed domains to prevent SSRF
        const allowedDomains = [
            'res.cloudinary.com',
            'lh3.googleusercontent.com',
            'avatars.githubusercontent.com',
            'supabase.co',           // Supabase Storage (*.supabase.co)
            'media.licdn.com',       // LinkedIn profile photos
            'postimg.cc',            // postimg hosting
        ];

        const isAllowed = allowedDomains.some(domain => 
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
            return NextResponse.json({ error: 'Domain not permitted for proxy' }, { status: 403 });
        }

        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        
        // 3. Ensure the response is actually an image
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('Invalid content type. Expected an image.');
        }

        const arrayBuffer = await response.arrayBuffer();
        
        // Return the image with CORS headers
        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error: any) {
        console.error('Error proxying image:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to proxy image' },
            { status: 500 }
        );
    }
}
