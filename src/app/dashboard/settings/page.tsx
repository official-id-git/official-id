'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 pt-12 pb-8">
        <div className="max-w-md mx-auto flex items-center gap-4">
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name} 
              className="w-16 h-16 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-2xl font-bold">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="text-white">
            <h2 className="font-semibold text-lg">{user.full_name}</h2>
            <p className="text-blue-100 text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Account Section */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 px-1">Akun</h3>
          <div className="space-y-2">
            {/* Profile */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Profil Saya</p>
                <p className="text-sm text-gray-500">Kelola informasi profil Anda</p>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Subscription */}
            <Link
              href="/dashboard/upgrade"
              className="flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Langganan Premium</p>
                <p className="text-sm text-gray-500">Upgrade dan kelola langganan</p>
              </div>
              {user.role === 'PAID_USER' && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full mr-2">
                  Pro
                </span>
              )}
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Keluar</span>
        </button>

        {/* App Version */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Official ID v1.0.0
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation variant="main" />
    </div>
  )
}
