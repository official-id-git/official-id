'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthContextType } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper: Convert Supabase Auth user to our User type
function authUserToUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    full_name: supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split('@')[0] ||
      'User',
    avatar_url: supabaseUser.user_metadata?.avatar_url ||
      supabaseUser.user_metadata?.picture ||
      null,
    role: 'FREE_USER',
    created_at: supabaseUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  // Track fetch state
  const fetchPromiseRef = useRef<Promise<User> | null>(null)

  // Ensure user profile exists and sync avatar from Google
  const ensureUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<boolean> => {
    const fallbackUser = authUserToUser(supabaseUser)

    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id, avatar_url')
        .eq('id', supabaseUser.id)
        .maybeSingle()

      if (existingProfile) {
        // Profile exists - update avatar if we have one from Google and DB doesn't
        const googleAvatar = supabaseUser.user_metadata?.avatar_url ||
          supabaseUser.user_metadata?.picture

        if (googleAvatar && !existingProfile.avatar_url) {
          await supabase
            .from('users')
            .update({
              avatar_url: googleAvatar,
              updated_at: new Date().toISOString()
            })
            .eq('id', supabaseUser.id)
        }
        return true
      }

      // Profile doesn't exist - create it
      const { error } = await supabase
        .from('users')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: fallbackUser.full_name,
          avatar_url: fallbackUser.avatar_url,
          role: 'FREE_USER',
        })

      if (error && !error.message.includes('duplicate')) {
        console.warn('useAuth: Could not create profile:', error.message)
        return false
      }

      return true
    } catch (err) {
      console.warn('useAuth: Profile ensure error:', err)
      return false
    }
  }, [supabase])

  // Fetch user profile - with deduplication
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User> => {
    // console.log('useAuth: Fetching profile for user:', supabaseUser.id)

    // Create fallback user from auth data
    const fallbackUser = authUserToUser(supabaseUser)

    try {
      // First, ensure the profile exists and sync avatar
      await ensureUserProfile(supabaseUser)

      // Then fetch it
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle()

      if (error) {
        console.warn('useAuth: Database error, using fallback:', error.message)
        return fallbackUser
      }

      if (data) {
        // console.log('useAuth: Profile fetched:', data)
        // Merge avatar_url from Google if not in DB
        if (!data.avatar_url && fallbackUser.avatar_url) {
          data.avatar_url = fallbackUser.avatar_url
        }
        return data as User
      }

      // console.log('useAuth: No profile in DB, using fallback')
      return fallbackUser
    } catch (err) {
      console.warn('useAuth: Fetch error, using fallback:', err)
      return fallbackUser
    }
  }, [supabase, ensureUserProfile])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      // console.log('useAuth: Initializing auth...')

      try {
        const { data: { session } } = await supabase.auth.getSession()
        // console.log('useAuth: Session:', session ? 'exists' : 'none')

        if (session?.user && mounted) {
          if (!fetchPromiseRef.current) {
            fetchPromiseRef.current = fetchUserProfile(session.user)
          }
          const userProfile = await fetchPromiseRef.current
          fetchPromiseRef.current = null

          if (mounted) {
            setUser(userProfile)
            // console.log('useAuth: User set:', userProfile)
          }
        }
      } catch (error) {
        console.error('useAuth: Init error:', error)
      } finally {
        if (mounted) {
          // console.log('useAuth: Setting loading=false')
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('useAuth: Auth changed:', event)

        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          fetchPromiseRef.current = null
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          // console.log('useAuth: Token refreshed')
          return
        }
      }
    )

    initAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchUserProfile])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      if (data.user) {
        const userProfile = await fetchUserProfile(data.user)
        setUser(userProfile)
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Gagal membuat akun')

    try {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role: 'FREE_USER',
      })
    } catch (err) {
      console.warn('useAuth: Profile creation in signUp failed:', err)
    }
  }

  // Sign in with Google
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }

  // Sign in with LinkedIn
  const signInWithLinkedIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) throw new Error(error.message)
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
    router.refresh()
  }

  // Refresh user data
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user)
      setUser(userProfile)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
