import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Terima data dari Frontend
    // Kita menerima accessToken langsung dari client (valid) menggantikan session server (sering null)
    const body = await req.json();
    const { accessToken, cardUrl, title, text, cardName, cardTitle, cardCompany } = body;

    // Validasi Token
    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Akses token tidak ditemukan. Silakan login ulang dengan LinkedIn.' 
      }, { status: 401 });
    }

    // 2. Ambil Data Profil LinkedIn (WAJIB untuk mendapatkan ID URN yang benar)
    // Logika lama menggunakan session.user.id yang SALAH untuk LinkedIn
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
        console.error('Gagal mengambil profil LinkedIn', await profileResponse.text());
        return NextResponse.json({ 
            success: false, 
            error: 'Gagal memverifikasi profil LinkedIn. Token mungkin kadaluarsa.' 
        }, { status: 401 });
    }

    const profileData = await profileResponse.json();
    // Format URN yang BENAR: urn:li:person:12345 (bukan UUID Supabase)
    const personUrn = `urn:li:person:${profileData.id}`; 

    // 3. Siapkan Pesan (Mempertahankan style pesan dari file lama Anda)
    // Jika 'text' dari client kosong, gunakan format default dengan emoji
    const shareText = text || `識 Lihat kartu bisnis digital saya!

${cardName ? `側 ${cardName}` : ''}
${cardTitle ? `直 ${cardTitle}` : ''}
${cardCompany ? `召 ${cardCompany}` : ''}

島 Buat kartu bisnis digital Anda sendiri di Official ID
${cardUrl}`;

    // 4. Post ke LinkedIn (Share)
    const shareResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0', // PENTING: Solusi error NO_VERSION
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: shareText,
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: {
                  text: 'Official ID Digital Card',
                },
                originalUrl: cardUrl,
                title: {
                  text: title || cardName || 'Digital Business Card',
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const shareData = await shareResponse.json();

    // Handling Error dari LinkedIn API
    if (!shareResponse.ok) {
        console.error('LinkedIn Share API Error:', shareData);
        
        // Error handling spesifik
        if (shareResponse.status === 401) {
            return NextResponse.json({ 
                success: false,
                error: 'Sesi LinkedIn kedaluwarsa. Silakan login ulang.' 
            }, { status: 401 });
        }
        
        if (shareData.serviceErrorCode === 100) {
             return NextResponse.json({ 
                success: false,
                error: 'Izin posting ditolak. Pastikan Anda telah menyetujui izin w_member_social.' 
            }, { status: 403 });
        }

        return NextResponse.json(
            { success: false, error: shareData.message || 'Gagal memposting ke LinkedIn' }, 
            { status: shareResponse.status }
        );
    }

    // Sukses
    return NextResponse.json({ 
        success: true, 
        data: shareData,
        message: 'Berhasil dibagikan ke LinkedIn!'
    });

  } catch (error: any) {
    console.error('Server Error:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message || 'Terjadi kesalahan internal server' 
    }, { status: 500 });
  }
}