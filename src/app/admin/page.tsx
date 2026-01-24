'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { OverviewTab } from '@/components/admin/OverviewTab'
import { PaymentsTab, PaymentLog } from '@/components/admin/PaymentsTab'
import { UsersTab } from '@/components/admin/UsersTab'
import { LogsTab, ActivityLog } from '@/components/admin/LogsTab'
import { SeoTab } from '@/components/admin/SeoTab'
import { BlogTab } from '@/components/admin/BlogTab'

interface AdminStats {
  totalUsers: number
  paidUsers: number
  freeUsers: number
  totalOrganizations: number
  totalCards: number
  pendingPayments: number
}

type AdminTab = 'overview' | 'payments' | 'users' | 'logs' | 'seo' | 'blogs'

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [payments, setPayments] = useState<PaymentLog[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [statsLoading, setStatsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role !== 'APP_ADMIN') {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadAdminData = async () => {
      if (user?.role !== 'APP_ADMIN') return

      setStatsLoading(true)
      try {
        // Fetch stats
        const [usersRes, orgsRes, cardsRes] = await Promise.all([
          supabase.from('users').select('id, role'),
          supabase.from('organizations').select('id'),
          supabase.from('business_cards').select('id'),
        ])

        const users = (usersRes.data || []) as { id: string; role: string }[]
        const paidUsers = users.filter(u => u.role === 'PAID_USER').length
        const freeUsers = users.filter(u => u.role === 'FREE_USER').length

        setStats({
          totalUsers: users.length,
          paidUsers,
          freeUsers,
          totalOrganizations: orgsRes.data?.length || 0,
          totalCards: cardsRes.data?.length || 0,
          pendingPayments: 0, // Will be from payment_logs table
        })

        // Mock payment logs (in production, create payment_logs table)
        setPayments([
          {
            id: '1',
            user_id: 'xxx',
            amount: 49000,
            status: 'PENDING',
            proof_url: 'https://example.com/proof1.jpg',
            created_at: new Date().toISOString(),
            user: { full_name: 'John Doe', email: 'john@example.com' }
          }
        ])

        // Mock activity logs
        setLogs([
          {
            id: '1',
            user_id: 'xxx',
            action: 'CREATE_CARD',
            details: 'Created new business card',
            created_at: new Date().toISOString(),
            user: { full_name: 'Data Official ID', email: 'dataofficialid@gmail.com' }
          },
          {
            id: '2',
            user_id: 'xxx',
            action: 'CREATE_ORG',
            details: 'Created organization: Tech Corp',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user: { full_name: 'Data Official ID', email: 'dataofficialid@gmail.com' }
          }
        ])

      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    loadAdminData()
  }, [user, supabase])

  const handleApprovePayment = async (paymentId: string) => {
    // In production: update payment status and user role
    setPayments(prev => prev.map(p =>
      p.id === paymentId ? { ...p, status: 'APPROVED' as const } : p
    ))
  }

  const handleRejectPayment = async (paymentId: string) => {
    setPayments(prev => prev.map(p =>
      p.id === paymentId ? { ...p, status: 'REJECTED' as const } : p
    ))
  }

  if (loading || !user || user.role !== 'APP_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-gray-400 text-sm">Official ID Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">👑</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
          <nav className="flex gap-8 whitespace-nowrap">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'payments', label: 'Pembayaran' },
              { id: 'users', label: 'Users' },
              { id: 'logs', label: 'Activity Logs' },
              { id: 'seo', label: 'SEO Settings' },
              { id: 'blogs', label: 'Blogs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={stats}
            statsLoading={statsLoading}
            paymentsCount={payments.filter(p => p.status === 'PENDING').length}
            logs={logs}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            payments={payments}
            handleApprovePayment={handleApprovePayment}
            handleRejectPayment={handleRejectPayment}
          />
        )}

        {activeTab === 'users' && <UsersTab />}

        {activeTab === 'logs' && <LogsTab logs={logs} />}

        {activeTab === 'seo' && <SeoTab />}

        {activeTab === 'blogs' && <BlogTab />}
      </div>
    </div>
  )
}
