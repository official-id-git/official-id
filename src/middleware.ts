import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

// Define protected routes
const protectedRoutes = ['/dashboard', '/cards', '/organizations', '/contacts', '/settings', '/upgrade']
const adminRoutes = ['/admin']
const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect pwa-official-id.vercel.app to official.id
  const hostname = request.headers.get('host')
  if (hostname && (hostname.includes('pwa-official-id.vercel.app') || hostname === 'pwa-official-id.vercel.app')) {
    const url = request.nextUrl.clone()
    url.hostname = 'official.id'
    url.protocol = 'https'
    url.port = ''
    return NextResponse.redirect(url)
  }

  // Update session and get user
  const { supabaseResponse, user } = await updateSession(request)

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access auth routes
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin route protection
  if (isAdminRoute && user) {
    const supabase = await createClient()
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'APP_ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Handle QR code scan flow
  // When unauthenticated user scans QR code (/card/{id})
  if (pathname.startsWith('/card/') && !user) {
    // Store the card ID in cookie for post-login redirect
    const cardId = pathname.split('/card/')[1]
    const response = NextResponse.next()
    response.cookies.set('scanned_card_id', cardId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
    })
    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}