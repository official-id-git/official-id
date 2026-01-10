'use client'

import { useState } from 'react'
import { X, Key, Loader2 } from 'lucide-react'

interface PinInputModalProps {
    isOpen: boolean
    templateName: string
    onClose: () => void
    onVerify: (pin: string) => Promise<boolean>
}

export function PinInputModal({ isOpen, templateName, onClose, onVerify }: PinInputModalProps) {
    const [pin, setPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pin.trim()) {
            setError('Masukkan PIN')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const isValid = await onVerify(pin)
            if (isValid) {
                setPin('')
                onClose()
            } else {
                setError('PIN tidak valid. Silakan coba lagi.')
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setPin('')
        setError(null)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Template Premium</h3>
                            <p className="text-sm text-white/80">{templateName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-gray-600 mb-4">
                        Template ini memerlukan PIN untuk menggunakannya.
                        Masukkan PIN yang diberikan untuk mengakses template.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode PIN
                        </label>
                        <input
                            type="text"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value.toUpperCase())
                                setError(null)
                            }}
                            placeholder="Masukkan PIN"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                            maxLength={10}
                            autoComplete="off"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !pin.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memverifikasi...
                                </>
                            ) : (
                                'Verifikasi PIN'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
