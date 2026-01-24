export interface ActivityLog {
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

interface LogsTabProps {
    logs: ActivityLog[]
}

export function LogsTab({ logs }: LogsTabProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900">Activity Logs</h3>
                <p className="text-sm text-gray-500">Lihat semua aktivitas sistem</p>
            </div>
            <div className="divide-y">
                {logs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${log.action.includes('CREATE') ? 'bg-green-100' :
                                    log.action.includes('DELETE') ? 'bg-red-100' :
                                        'bg-blue-100'
                                }`}>
                                <svg className={`w-5 h-5 ${log.action.includes('CREATE') ? 'text-green-600' :
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
    )
}
