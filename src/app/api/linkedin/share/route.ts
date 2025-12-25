import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get LinkedIn access token from session
    const providerToken = session.provider_token
    
    if (!providerToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'LinkedIn tidak terhubung. Silakan login ulang dengan LinkedIn.' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { cardId, cardName, cardTitle, cardCompany, cardUrl, message } = body

    // Build the share content
    const shareText = message || `🎯 Lihat kartu bisnis digital saya!

👤 ${cardName}
${cardTitle ? `💼 ${cardTitle}` : ''}
${cardCompany ? `🏢 ${cardCompany}` : ''}

📇 Buat kartu bisnis digital Anda sendiri di Official ID | https://pwa-official-id.vercel.app/

${cardUrl}`

    // Post to LinkedIn using UGC Post API
    const linkedInResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${session.user.user_metadata?.sub || session.user.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: shareText
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: {
                  text: `Kartu bisnis digital ${cardName}`
                },
                originalUrl: cardUrl,
                title: {
                  text: `${cardName} - Official ID`
                }
              }
            ]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    })

    if (!linkedInResponse.ok) {
      const errorData = await linkedInResponse.json().catch(() => ({}))
      console.error('LinkedIn API error:', errorData)
      
      // Check for specific errors
      if (linkedInResponse.status === 401) {
        return NextResponse.json({ 
          success: false, 
          error: 'Sesi LinkedIn kedaluwarsa. Silakan login ulang dengan LinkedIn.' 
        }, { status: 401 })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorData.message || 'Gagal posting ke LinkedIn' 
      }, { status: linkedInResponse.status })
    }

    const result = await linkedInResponse.json()

    return NextResponse.json({ 
      success: true, 
      postId: result.id,
      message: 'Berhasil dibagikan ke LinkedIn!'
    })

  } catch (error: any) {
    console.error('LinkedIn share error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
