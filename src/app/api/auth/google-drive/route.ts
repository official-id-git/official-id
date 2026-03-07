import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET() {
    const clientId = process.env.GDRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        return NextResponse.json(
            { error: 'Google Client ID or Secret is not configured in environment variables.' },
            { status: 500 }
        )
    }

    // Gunakan NEXT_PUBLIC_SITE_URL sebagai base URL, fallback ke localhost:3000
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/auth/google-drive-callback`

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    )

    // Generate URL to the Google consent screen
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Meminta refresh token
        prompt: 'consent',      // Memaksa persetujuan user setiap saat agar refresh token selalu digenerate
        scope: [
            'https://www.googleapis.com/auth/drive.file', // Akses ke file yang dibuat oleh aplikasi
            'https://www.googleapis.com/auth/drive',      // Akses full drive (diperlukan jika butuh mengelola file lain)
        ],
    })

    // Redirect user to Google
    return NextResponse.redirect(authUrl)
}
