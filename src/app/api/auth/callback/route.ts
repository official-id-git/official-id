import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Use environment variable or fallback to production URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pwa-official-id.vercel.app'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user profile exists
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // Create user profile if doesn't exist (first time Google login)
      if (!userProfile) {
        const fullName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name || 
                        data.user.email?.split('@')[0] || 
                        'User'

        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          avatar_url: data.user.user_metadata?.avatar_url,
          role: 'FREE_USER',
        })
      }

      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${siteUrl}/login?error=oauth_failed`)
}
