'use client'

import { useState } from 'react'
import type { OrganizationRequest } from '@/types'

interface OrganizationRequestsProps {
    requests: OrganizationRequest[]
    onReview: (requestId: string, status: 'APPROVED' | 'REJECTED') => Promise<boolean>
    onUpdate: () => void
}

export function OrganizationRequests({ requests, onReview, onUpdate }: OrganizationRequestsProps) {
    const [processingId, setProcessingId] = useState<string | null>(null)

    const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`Are you sure you want to ${status.toLowerCase()} this request?`)) return

        setProcessingId(id)
        const success = await onReview(id, status)
        if (success) {
            onUpdate()
        }
        setProcessingId(null)
    }

    const pendingRequests = requests.filter(r => r.status === 'PENDING')
    const reviewedRequests = requests.filter(r => r.status !== 'PENDING')

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Requests Yet</h3>
                <p className="text-gray-500">There are no pending requests to join this Circle.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Pending Requests */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Pending Requests ({pendingRequests.length})
                    </h3>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No pending requests</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="p-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-center hover:bg-gray-50/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-semibold text-gray-900 truncate">
                                            {request.email}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                            Pending
                                        </span>
                                    </div>
                                    {request.message && (
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2 mb-2 italic">
                                            "{request.message}"
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Requested on {new Date(request.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                    <button
                                        onClick={() => handleReview(request.id, 'APPROVED')}
                                        disabled={processingId === request.id}
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                                    >
                                        {processingId === request.id ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => handleReview(request.id, 'REJECTED')}
                                        disabled={processingId === request.id}
                                        className="px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-medium rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reviewed Requests */}
            {reviewedRequests.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-lg font-semibold text-gray-900">
                            History
                        </h3>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {reviewedRequests.map(request => (
                            <div key={request.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-medium text-gray-900 truncate">
                                            {request.email}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${request.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                                        </span>
                                    </div>
                                    {request.message && (
                                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                                            Message: {request.message}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                        Requested: {new Date(request.created_at).toLocaleDateString()}
                                        {request.reviewed_at && ` • Reviewed: ${new Date(request.reviewed_at).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
