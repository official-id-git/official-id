export interface PaymentLog {
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

interface PaymentsTabProps {
    payments: PaymentLog[]
    handleApprovePayment: (id: string) => void
    handleRejectPayment: (id: string) => void
}

export function PaymentsTab({ payments, handleApprovePayment, handleRejectPayment }: PaymentsTabProps) {
    return (
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
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
    )
}
