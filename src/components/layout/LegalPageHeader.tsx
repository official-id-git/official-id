'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LogIn } from 'lucide-react'

export default function LegalPageHeader() {
    return (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Brand */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/logo.png"
                            alt="Official ID Logo"
                            width={40}
                            height={40}
                            className="group-hover:scale-105 transition-transform"
                        />
                        <span className="text-xl font-bold text-gray-900 hidden sm:block">
                            Official ID
                        </span>
                    </Link>

                    {/* Login Button */}
                    <Link
                        href="/login"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:-translate-y-0.5"
                        style={{
                            background: 'linear-gradient(135deg, #2D7C88 0%, #236B76 100%)',
                            boxShadow: '0 4px 12px rgba(45, 124, 136, 0.25)'
                        }}
                    >
                        <LogIn className="w-4 h-4" />
                        <span>Login</span>
                    </Link>
                </div>
            </div>
        </header>
    )
}
