import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
        return NextResponse.json({ error: `Berhasil ditolak oleh pengguna: ${error}` }, { status: 400 })
    }

    if (!code) {
        return NextResponse.json({ error: 'Kode otorisasi Google tidak ditemukan dalam request.' }, { status: 400 })
    }

    const clientId = process.env.GDRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
        return NextResponse.json(
            { error: 'Google Client ID atau Secret tidak dikonfigurasi.' },
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

    try {
        // Menukar kode dengan akses token & refresh token
        const { tokens } = await oauth2Client.getToken(code)

        if (tokens.refresh_token) {
            // Return sebuah halaman HTML sederhana agar admin bisa mengkopinya ke .env.local
            const htmlResponse = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Google Drive Authentication Berhasil</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f3f4f6; color: #1f2937; padding: 2rem; display: flex; justify-content: center; min-height: 100vh; align-items: center; }
            .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 600px; width: 100%; }
            h1 { color: #10b981; margin-top: 0; font-size: 1.5rem; }
            pre { background: #1f2937; color: #10b981; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.875rem; white-space: pre-wrap; word-wrap: break-word; }
            p { line-height: 1.5; margin-bottom: 1.5rem; }
            .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 1rem; margin-bottom: 1.5rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Berhasil Terhubung ke Google Drive!</h1>
            <p>Aplikasi Anda sekarang memiliki akses offline ke Google Drive.</p>
            
            <div class="alert">
              <strong>Tindakan Dibutuhkan:</strong><br/>
              Silakan salin <strong>Refresh Token</strong> di bawah ini dan paste ke dalam file <code>.env.local</code> proyek Anda sebagai nilai untuk variabel <code>GOOGLE_REFRESH_TOKEN</code>.
            </div>
            
            <p><strong>GOOGLE_REFRESH_TOKEN=</strong></p>
            <pre id="token">${tokens.refresh_token}</pre>
            
            <button onclick="navigator.clipboard.writeText(document.getElementById('token').innerText); alert('Token disalin!')" style="background:#3b82f6;color:white;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer;font-weight:bold;">
              Salin Refresh Token
            </button>
            
             <div style="margin-top: 2rem; border-top: 1px solid #e5e7eb; padding-top: 1rem; font-size: 0.875rem; color: #6b7280;">
              Setelah menyimpan token di .env.local, pastikan Anda merestart server development (<code>npm run dev</code>) atau melakukan deploy ulang di production.
              <br/><br/>
              <a href="/dashboard" style="color:#3b82f6; text-decoration: none;">&larr; Kembali ke Dashboard</a>
            </div>
          </div>
        </body>
        </html>
      `
            return new NextResponse(htmlResponse, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html',
                },
            })
        } else {
            return NextResponse.json(
                { error: 'Berhasil login, tetapi Google tidak memberikan refresh_token baru. Harap revoke izin app di Akun Google Anda dan coba lagi.' },
                { status: 400 }
            )
        }
    } catch (err: any) {
        console.error('Google OAuth Error:', err)
        return NextResponse.json(
            { error: 'Gagal menukar kode dengan token', details: err.message },
            { status: 500 }
        )
    }
}
