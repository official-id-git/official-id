'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useMessages } from '@/hooks/useMessages' // Assuming you want to use the hook here too, or pass it down

export default function DashboardHeader({ onOpenSideMenu }: { onOpenSideMenu: () => void }) {
    const { getUnreadCount } = useMessages()
    const [unreadMessages, setUnreadMessages] = useState(0)

    useEffect(() => {
        const loadUnreadMessages = async () => {
            const count = await getUnreadCount()
            setUnreadMessages(count)
        }
        loadUnreadMessages()

        // Refresh count every 30 seconds
        const interval = setInterval(loadUnreadMessages, 30000)
        return () => clearInterval(interval)
    }, [getUnreadCount])

    return (
        <div className="relative overflow-hidden rounded-b-3xl mb-6">
            <div className="absolute inset-0 bg-blue-600/5 z-0" />
            {/* Animated Background Elements - Simplified for reused header */}
            <div className="absolute inset-0 z-10 opacity-30 pointer-events-none overflow-hidden">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20" />
                <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20" />
            </div>

            <div className="relative z-20 px-4 pt-12 pb-6">
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between">
                        {/* Logo Area */}
                        <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full animate-spin-slow opacity-75 blur-sm" />
                            <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                                <Image src="/logo.png" alt="Official ID" width={32} height={32} className="object-contain" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg">
                                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                            </div>
                        </div>

                        {/* Header Right Icons */}
                        <div className="flex items-center gap-2">
                            {/* Bell/Notification Icon with Badge */}
                            <Link
                                href="/dashboard/messages"
                                className="relative w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-600 hover:bg-white/60 transition-all duration-300 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadMessages > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                        {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </span>
                                )}
                            </Link>

                            {/* Hamburger Menu Icon */}
                            <button
                                onClick={onOpenSideMenu}
                                className="w-10 h-10 bg-white/40 backdrop-blur-md rounded-xl flex items-center justify-center text-blue-600 hover:bg-white/60 transition-all duration-300 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
