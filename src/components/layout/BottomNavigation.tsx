'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMessages } from '@/hooks/useMessages'

interface BottomNavigationProps {
  showBack?: boolean
  backHref?: string
  variant?: 'main' | 'cards' | 'organizations' | 'messages'
}

export default function BottomNavigation({
  showBack = false,
  backHref = '/dashboard',
  variant = 'main'
}: BottomNavigationProps) {
  const router = useRouter()
  const { getUnreadCount } = useMessages()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const loadUnreadCount = async () => {
      const count = await getUnreadCount()
      setUnreadCount(count)
    }
    loadUnreadCount()

    // Refresh count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [getUnreadCount])

  // Messages icon with badge component
  const MessagesIcon = ({ isActive = false }: { isActive?: boolean }) => (
    <div className="relative">
      <svg className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  )

  // Main navigation (Home)
  if (variant === 'main') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pb-safe z-50">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-xs text-blue-600 font-medium">Home</span>
          </Link>

          <Link href="/dashboard/cards" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs text-gray-500">Cards</span>
          </Link>

          <Link href="/dashboard/messages" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <MessagesIcon />
            <span className="text-xs text-gray-500">Messages</span>
          </Link>

          <Link href="/dashboard/organizations" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs text-gray-500">Circle</span>
          </Link>

        </div>
      </div>
    )
  }

  // Messages navigation
  if (variant === 'messages') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pb-safe z-50">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          <button
            onClick={() => router.back()}
            className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs text-gray-500">Back</span>
          </button>

          <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-gray-500">Home</span>
          </Link>

          <Link href="/dashboard/messages" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <MessagesIcon isActive />
            <span className="text-xs text-blue-600 font-medium">Messages</span>
          </Link>

          <Link href="/dashboard/organizations" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs text-gray-500">Circle</span>
          </Link>

        </div>
      </div>
    )
  }

  // Cards navigation (Back, Home, Circle, Contacts, More)
  if (variant === 'cards') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pb-safe z-50">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs text-gray-500">Back</span>
          </button>

          {/* Home */}
          <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-gray-500">Home</span>
          </Link>

          {/* Messages */}
          <Link href="/dashboard/messages" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <MessagesIcon />
            <span className="text-xs text-gray-500">Messages</span>
          </Link>

          {/* Circle */}
          <Link href="/dashboard/organizations" className="flex flex-col items-center gap-1 py-2 px-2 min-w-[56px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs text-gray-500">Circle</span>
          </Link>

        </div>
      </div>
    )
  }

  // Organizations navigation (Back, Home, Cards)
  if (variant === 'organizations') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pb-safe z-50">
        <div className="max-w-md mx-auto flex items-center justify-around py-2">
          <button
            onClick={() => router.back()}
            className="flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs text-gray-500">Back</span>
          </button>

          <Link href="/dashboard" className="flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-gray-500">Home</span>
          </Link>

          <Link href="/dashboard/messages" className="flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]">
            <MessagesIcon />
            <span className="text-xs text-gray-500">Messages</span>
          </Link>

          <Link href="/dashboard/cards" className="flex flex-col items-center gap-1 py-2 px-3 min-w-[64px]">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-xs text-gray-500">Cards</span>
          </Link>
        </div>
      </div>
    )
  }

  return null
}

