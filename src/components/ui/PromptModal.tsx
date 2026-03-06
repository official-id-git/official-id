import React, { useState, useEffect } from 'react'

interface PromptModalProps {
    isOpen: boolean
    title: string
    message: string | React.ReactNode
    onConfirm: (value: string) => void
    onCancel: () => void
    confirmText?: string
    cancelText?: string
    placeholder?: string
    defaultValue?: string
    isLoading?: boolean
    inputType?: 'text' | 'textarea'
}

export default function PromptModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    placeholder = '',
    defaultValue = '',
    isLoading = false,
    inputType = 'text'
}: PromptModalProps) {
    const [inputValue, setInputValue] = useState(defaultValue)

    // Reset input when modal opens with new default value
    useEffect(() => {
        if (isOpen) setInputValue(defaultValue)
    }, [isOpen, defaultValue])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">{title}</h3>
                        <p className="text-sm text-gray-600">{message}</p>
                    </div>
                    <div className="mt-4">
                        {inputType === 'textarea' ? (
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                autoFocus
                            />
                        ) : (
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
                                        onConfirm(inputValue)
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 flex-wrap sm:flex-nowrap border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onConfirm(inputValue)}
                        disabled={isLoading || !inputValue.trim()}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <span>{confirmText}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
