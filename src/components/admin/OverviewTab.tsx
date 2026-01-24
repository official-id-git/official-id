import Link from 'next/link'
import { StatCard } from './StatCard'

interface AdminStats {
    totalUsers: number
    paidUsers: number
    freeUsers: number
    totalOrganizations: number
    totalCards: number
    pendingPayments: number
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

interface OverviewTabProps {
    stats: AdminStats | null
    statsLoading: boolean
    paymentsCount: number
    logs: ActivityLog[]
    setActiveTab: (tab: 'overview' | 'payments' | 'users' | 'logs' | 'seo' | 'blogs') => void
}

export function OverviewTab({ stats, statsLoading, paymentsCount, logs, setActiveTab }: OverviewTabProps) {
    return (
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
                    value={paymentsCount}
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
                    <button
                        onClick={() => setActiveTab('seo')}
                        className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                    >
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700">SEO Settings</span>
                    </button>
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
    )
}
