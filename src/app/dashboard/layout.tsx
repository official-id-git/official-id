'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import SideMenu from '@/components/layout/SideMenu'
import DashboardHeader from '@/components/layout/DashboardHeader'
import BottomNavigation from '@/components/layout/BottomNavigation'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sideMenuOpen, setSideMenuOpen] = useState(false)
    const pathname = usePathname()

    const getNavVariant = () => {
        if (pathname === '/dashboard') return 'main'
        // StartsWith check for nested routes
        if (pathname?.startsWith('/dashboard/cards')) return 'cards'
        if (pathname?.startsWith('/dashboard/organizations')) return 'organizations'
        if (pathname?.startsWith('/dashboard/messages')) return 'messages'
        return 'main'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader onOpenSideMenu={() => setSideMenuOpen(true)} />

            <main className="pb-24">
                {children}
            </main>

            <SideMenu isOpen={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
            <BottomNavigation variant={getNavVariant()} />
        </div>
    )
}
