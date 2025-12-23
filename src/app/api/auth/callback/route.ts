import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if user profile exists
      const { data: userProfile, error: profileError } = await supabase
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

        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          avatar_url: data.user.user_metadata?.avatar_url,
          role: 'FREE_USER',
        })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          // Continue anyway - user might already exist from race condition
        }
      }

      // Check if there's a scanned card to redirect to
      const scannedCardId = request.cookies.get('scanned_card_id')?.value

      if (scannedCardId) {
        // Redirect to the card page after login
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        const protocol = isLocalEnv ? 'http' : 'https'
        const host = forwardedHost || origin

        return NextResponse.redirect(`${protocol}://${host}/card/${scannedCardId}`)
      }

      // Regular login redirect
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const protocol = isLocalEnv ? 'http' : 'https'
      const host = forwardedHost || origin

      return NextResponse.redirect(`${protocol}://${host}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
