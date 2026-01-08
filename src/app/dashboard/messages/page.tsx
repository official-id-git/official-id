'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import BottomNavigation from '@/components/layout/BottomNavigation'

type Message = {
    id: string
    recipient_id: string
    sender_name: string
    sender_whatsapp: string
    sender_email: string
    purpose: 'bermitra' | 'produk' | 'jasa' | 'investasi' | 'lainnya'
    message: string
    is_read: boolean
    created_at: string
}

const PURPOSE_LABELS: Record<string, string> = {
    bermitra: 'Minat Bermitra',
    produk: 'Minat Produk',
    jasa: 'Minat Jasa',
    investasi: 'Minat Berinvestasi',
    lainnya: 'Lainnya',
}

const PURPOSE_COLORS: Record<string, string> = {
    bermitra: 'bg-blue-100 text-blue-700',
    produk: 'bg-green-100 text-green-700',
    jasa: 'bg-purple-100 text-purple-700',
    investasi: 'bg-yellow-100 text-yellow-700',
    lainnya: 'bg-gray-100 text-gray-700',
}

function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays < 7) return `${diffDays} hari lalu`

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export default function MessagesPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const { fetchMessages, markAsRead, markAllAsRead, deleteMessage, loading } = useMessages()

    const [messages, setMessages] = useState<Message[]>([])
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (user) {
            loadMessages()
        }
    }, [user])

    const loadMessages = async () => {
        const data = await fetchMessages()
        setMessages(data as Message[])
    }

    const handleMarkAsRead = async (messageId: string) => {
        await markAsRead(messageId)
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, is_read: true } : m
        ))
    }

    const handleMarkAllAsRead = async () => {
        await markAllAsRead()
        setMessages(prev => prev.map(m => ({ ...m, is_read: true })))
    }

    const handleDelete = async (messageId: string) => {
        if (confirm('Hapus pesan ini?')) {
            await deleteMessage(messageId)
            setMessages(prev => prev.filter(m => m.id !== messageId))
            setSelectedMessage(null)
        }
    }

    const handleOpenMessage = (message: Message) => {
        setSelectedMessage(message)
        if (!message.is_read) {
            handleMarkAsRead(message.id)
        }
    }

    const unreadCount = messages.filter(m => !m.is_read).length

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-white border-b px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pesan Masuk</h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {unreadCount > 0 ? `${unreadCount} pesan baru` : 'Tidak ada pesan baru'}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages List */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada pesan</h3>
                        <p className="text-gray-500">Pesan dari Circle Network akan muncul di sini</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                onClick={() => handleOpenMessage(message)}
                                className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${!message.is_read ? 'border-l-4 border-l-blue-500' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-lg">
                                            {message.sender_name.charAt(0)}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">{message.sender_name}</span>
                                            {!message.is_read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${PURPOSE_COLORS[message.purpose]}`}>
                                            {PURPOSE_LABELS[message.purpose]}
                                        </span>
                                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{message.message}</p>
                                    </div>

                                    {/* Time */}
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {formatDate(message.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-gray-900">Detail Pesan</h2>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Sender Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">
                                        {selectedMessage.sender_name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{selectedMessage.sender_name}</h3>
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${PURPOSE_COLORS[selectedMessage.purpose]}`}>
                                        {PURPOSE_LABELS[selectedMessage.purpose]}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    <a href={`https://wa.me/${selectedMessage.sender_whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-green-600">
                                        {selectedMessage.sender_whatsapp}
                                    </a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <a href={`mailto:${selectedMessage.sender_email}`} className="text-gray-700 hover:text-blue-600">
                                        {selectedMessage.sender_email}
                                    </a>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Pesan:</h4>
                                <p className="text-gray-800 bg-gray-50 rounded-xl p-4 leading-relaxed">
                                    {selectedMessage.message}
                                </p>
                            </div>

                            {/* Time */}
                            <p className="text-sm text-gray-400">
                                Diterima: {new Date(selectedMessage.created_at).toLocaleString('id-ID')}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <a
                                    href={`https://wa.me/${selectedMessage.sender_whatsapp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-3 bg-green-600 text-white text-center rounded-xl font-medium hover:bg-green-700 transition-colors"
                                >
                                    Balas via WhatsApp
                                </a>
                                <button
                                    onClick={() => handleDelete(selectedMessage.id)}
                                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNavigation variant="messages" />
        </div>
    )
}
