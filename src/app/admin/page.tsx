'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface AdminStats {
  totalUsers: number
  paidUsers: number
  freeUsers: number
  totalOrganizations: number
  totalCards: number
  pendingPayments: number
}

interface PaymentLog {
  id: string
  user_id: string
  amount: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  proof_url?: string
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: string
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [payments, setPayments] = useState<PaymentLog[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'users' | 'logs'>('overview')
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

  if (loading || !user || user.role !== 'APP_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'payments', label: 'Pembayaran' },
              { id: 'users', label: 'Users' },
              { id: 'logs', label: 'Activity Logs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard 
                label="Total Users" 
                value={stats?.totalUsers || 0} 
                icon="users"
                color="blue"
                loading={statsLoading}
              />
              <StatCard 
                label="Paid Users" 
                value={stats?.paidUsers || 0} 
                icon="star"
                color="yellow"
                loading={statsLoading}
              />
              <StatCard 
                label="Free Users" 
                value={stats?.freeUsers || 0} 
                icon="user"
                color="gray"
                loading={statsLoading}
              />
              <StatCard 
                label="Organizations" 
                value={stats?.totalOrganizations || 0} 
                icon="building"
                color="purple"
                loading={statsLoading}
              />
              <StatCard 
                label="Business Cards" 
                value={stats?.totalCards || 0} 
                icon="card"
                color="green"
                loading={statsLoading}
              />
              <StatCard 
                label="Pending Payments" 
                value={payments.filter(p => p.status === 'PENDING').length} 
                icon="clock"
                color="orange"
                loading={statsLoading}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Review Payments</span>
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Manage Users</span>
                </button>
                <button 
                  onClick={() => setActiveTab('logs')}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">View Logs</span>
                </button>
                <Link 
                  href="/dashboard"
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">User Dashboard</span>
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {logs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">{log.user?.full_name?.charAt(0) || '?'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.user?.full_name}</p>
                      <p className="text-xs text-gray-500">{log.details}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900">Bukti Pembayaran</h3>
                <p className="text-sm text-gray-500">Review dan approve pembayaran upgrade</p>
              </div>
              
              {payments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Belum ada pembayaran pending</p>
                </div>
              ) : (
                <div className="divide-y">
                  {payments.map(payment => (
                    <div key={payment.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">
                              {payment.user?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{payment.user?.full_name}</h4>
                            <p className="text-sm text-gray-500">{payment.user?.email}</p>
                            <p className="text-lg font-semibold text-gray-900 mt-1">
                              Rp {payment.amount.toLocaleString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(payment.created_at).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            payment.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {payment.status}
                          </span>
                          {payment.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprovePayment(payment.id)}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectPayment(payment.id)}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {payment.proof_url && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-2">Bukti Transfer:</p>
                          <a 
                            href={payment.proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Lihat Bukti →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-500">Kelola semua pengguna</p>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                User management table akan ditampilkan di sini
              </p>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-900">Activity Logs</h3>
              <p className="text-sm text-gray-500">Lihat semua aktivitas sistem</p>
            </div>
            <div className="divide-y">
              {logs.map(log => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      log.action.includes('CREATE') ? 'bg-green-100' :
                      log.action.includes('DELETE') ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        log.action.includes('CREATE') ? 'text-green-600' :
                        log.action.includes('DELETE') ? 'text-red-600' :
                        'text-blue-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{log.user?.full_name}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {log.action}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{log.details}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  loading 
}: { 
  label: string
  value: number
  icon: string
  color: string
  loading: boolean
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
        {icon === 'users' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {icon === 'star' && (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )}
        {icon === 'user' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
        {icon === 'building' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )}
        {icon === 'card' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )}
        {icon === 'clock' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">
        {loading ? '...' : value}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
