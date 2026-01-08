'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface SideMenuProps {
    isOpen: boolean
    onClose: () => void
}

const menuItems = [
    {
        label: 'Pengaturan',
        href: '/dashboard/settings',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        label: 'Kontak Saya',
        href: '/dashboard/contacts',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        label: 'Upgrade ke Pro',
        href: '/dashboard/upgrade',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
        ),
        highlight: true,
    },
    {
        label: 'Bantuan',
        href: '/dashboard/help',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
]

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const router = useRouter()
    const { user, signOut } = useAuth()

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    const handleNavigation = (href: string) => {
        onClose()
        router.push(href)
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Side Menu Panel */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* User Info */}
                {user && (
                    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                    {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                    {user.full_name || 'User'}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <div className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.href}
                            onClick={() => handleNavigation(item.href)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${item.highlight
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 hover:from-yellow-100 hover:to-orange-100'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span className={item.highlight ? 'text-yellow-600' : 'text-gray-500'}>
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                            {item.highlight && (
                                <span className="ml-auto px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                                    PRO
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="px-6">
                    <div className="border-t border-gray-200"></div>
                </div>

                {/* Sign Out */}
                <div className="p-4">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Keluar</span>
                    </button>
                </div>

                {/* App Version */}
                <div className="absolute bottom-20 left-0 right-0 px-6">
                    <p className="text-center text-xs text-gray-400">Official.id v1.0</p>
                </div>
            </div>
        </>
    )
}
