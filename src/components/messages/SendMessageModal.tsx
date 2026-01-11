import { useState, useEffect } from 'react'
import { useMessages, SendMessageData } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

interface SendMessageModalProps {
    isOpen: boolean
    onClose: () => void
    recipientId: string
    recipientName: string
}

const PURPOSE_OPTIONS = [
    { value: 'bermitra', label: 'Partnership Interest' },
    { value: 'produk', label: 'Product Interest' },
    { value: 'jasa', label: 'Service Interest' },
    { value: 'investasi', label: 'Investment Interest' },
    { value: 'lainnya', label: 'Other' },
] as const

export default function SendMessageModal({ isOpen, onClose, recipientId, recipientName }: SendMessageModalProps) {
    const { user } = useAuth()
    const { sendMessage, loading, error } = useMessages()
    const [formData, setFormData] = useState({
        sender_name: '',
        sender_whatsapp: '',
        sender_email: '',
        purpose: 'bermitra' as SendMessageData['purpose'],
        message: '',
    })
    const [success, setSuccess] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [isPhoneLoading, setIsPhoneLoading] = useState(false)

    // Effect to auto-populate data for logged-in users
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                sender_name: user.full_name || '',
                sender_email: user.email || '',
            }))

            // Fetch phone from business cards
            const fetchPhone = async () => {
                setIsPhoneLoading(true)
                try {
                    const supabase = createClient()
                    const { data } = await supabase
                        .from('business_cards')
                        .select('phone')
                        .eq('user_id', user.id)
                        .limit(1)
                        .maybeSingle()

                    if (data && (data as any).phone) {
                        setFormData(prev => ({ ...prev, sender_whatsapp: (data as any).phone }))
                    }
                } catch (err) {
                    console.error('Error fetching phone:', err)
                } finally {
                    setIsPhoneLoading(false)
                }
            }
            fetchPhone()
        }
    }, [user, isOpen]) // Re-run when modal opens to ensure fresh data

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        if (name === 'message' && value.length > 250) return
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormError(null)

        // Validation
        if (!formData.sender_name.trim()) {
            setFormError('Name is required')
            return
        }
        if (!formData.sender_whatsapp.trim()) {
            setFormError('WhatsApp number is required')
            return
        }
        if (!formData.sender_email.trim()) {
            setFormError('Email is required')
            return
        }
        if (!formData.message.trim()) {
            setFormError('Message is required')
            return
        }

        const result = await sendMessage({
            recipient_id: recipientId,
            ...formData,
        })

        if (result) {
            setSuccess(true)
            setTimeout(() => {
                onClose()
                setSuccess(false)
                // Reset form but keep user data if logged in
                setFormData(prev => ({
                    ...prev,
                    purpose: 'bermitra',
                    message: '',
                    // Keep sender info if user is logged in, otherwise clear
                    sender_name: user ? prev.sender_name : '',
                    sender_whatsapp: user ? prev.sender_whatsapp : '',
                    sender_email: user ? prev.sender_email : '',
                }))
            }, 2000)
        }
    }

    if (!isOpen) return null

    // Determine visibility of fields
    // Hide Name & Email if we have them from user
    // Hide WhatsApp only if we have it populated (fetched)
    const showName = !user?.full_name
    const showEmail = !user?.email
    const showWhatsapp = !user || (!formData.sender_whatsapp && !isPhoneLoading)

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
                        <p className="text-sm text-gray-500 mt-1">To: {recipientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Success State */}
                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
                        <p className="text-gray-500">Your message has been sent to {recipientName}</p>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {(formError || error) && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                {formError || error}
                            </div>
                        )}

                        {/* Nama - Shown only if not auto-populated */}
                        {showName && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="sender_name"
                                    value={formData.sender_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your name"
                                />
                            </div>
                        )}

                        {/* WhatsApp - Shown only if not auto-populated */}
                        {showWhatsapp && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    WhatsApp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="sender_whatsapp"
                                    value={formData.sender_whatsapp}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+62812345678"
                                />
                            </div>
                        )}

                        {/* Email - Shown only if not auto-populated */}
                        {showEmail && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="sender_email"
                                    value={formData.sender_email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="email@example.com"
                                />
                            </div>
                        )}

                        {/* Keperluan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purpose <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                {PURPOSE_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Pesan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={4}
                                maxLength={250}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Write your message..."
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">
                                {formData.message.length}/250 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || isPhoneLoading}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading || isPhoneLoading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
