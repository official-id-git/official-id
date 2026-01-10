'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Lock, Crown, Key, Check, X, Save, Loader2 } from 'lucide-react'

interface TemplateSettings {
    id: string
    template_id: string
    template_name: string
    access_type: 'free' | 'pro' | 'pin'
    pin_code: string | null
    is_active: boolean
    display_order: number
}

export default function AdminTemplatesPage() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [templates, setTemplates] = useState<TemplateSettings[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        if (!authLoading && user?.role !== 'APP_ADMIN') {
            router.push('/dashboard')
        }
    }, [authLoading, user, router])

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/admin/templates')
            const data = await res.json()

            if (data.success) {
                setTemplates(data.data || [])
            } else {
                setError(data.error || 'Failed to load templates')
            }
        } catch (err) {
            setError('Failed to load templates')
        } finally {
            setLoading(false)
        }
    }

    const updateTemplate = async (template: TemplateSettings, updates: Partial<TemplateSettings>) => {
        try {
            setSaving(template.id)
            setError(null)
            setSuccess(null)

            const res = await fetch('/api/admin/templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: template.id, ...updates })
            })

            const data = await res.json()

            if (data.success) {
                setTemplates(prev => prev.map(t =>
                    t.id === template.id ? { ...t, ...data.data } : t
                ))
                setSuccess(`Template "${template.template_name}" berhasil diupdate`)
                setTimeout(() => setSuccess(null), 3000)
            } else {
                setError(data.error || 'Failed to update template')
            }
        } catch (err) {
            setError('Failed to update template')
        } finally {
            setSaving(null)
        }
    }

    const getAccessIcon = (type: string) => {
        switch (type) {
            case 'free': return <Check className="w-4 h-4 text-green-600" />
            case 'pro': return <Crown className="w-4 h-4 text-yellow-600" />
            case 'pin': return <Key className="w-4 h-4 text-purple-600" />
            default: return null
        }
    }

    const getAccessBadge = (type: string) => {
        const classes = {
            free: 'bg-green-100 text-green-800',
            pro: 'bg-yellow-100 text-yellow-800',
            pin: 'bg-purple-100 text-purple-800'
        }
        return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800'
    }

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (user?.role !== 'APP_ADMIN') {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard/admin" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Template Management</h1>
                        <p className="text-sm text-gray-500">Kelola akses template kartu nama</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Alerts */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <X className="w-5 h-5" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        {success}
                    </div>
                )}

                {/* Legend */}
                <div className="mb-6 bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Tipe Akses Template</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccessBadge('free')}`}>
                                <Check className="w-3 h-3 inline mr-1" />Free
                            </span>
                            <span className="text-sm text-gray-600">Semua pengguna</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccessBadge('pro')}`}>
                                <Crown className="w-3 h-3 inline mr-1" />Pro
                            </span>
                            <span className="text-sm text-gray-600">Hanya PAID_USER & APP_ADMIN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccessBadge('pin')}`}>
                                <Key className="w-3 h-3 inline mr-1" />PIN
                            </span>
                            <span className="text-sm text-gray-600">Memerlukan PIN untuk menggunakan</span>
                        </div>
                    </div>
                </div>

                {/* Templates Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Template
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipe Akses
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        PIN Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {templates.map((template) => (
                                    <TemplateRow
                                        key={template.id}
                                        template={template}
                                        saving={saving === template.id}
                                        onUpdate={(updates) => updateTemplate(template, updates)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {templates.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Belum ada template settings.</p>
                        <p className="text-sm">Jalankan SQL migration di Supabase untuk menambahkan data.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

function TemplateRow({
    template,
    saving,
    onUpdate
}: {
    template: TemplateSettings
    saving: boolean
    onUpdate: (updates: Partial<TemplateSettings>) => void
}) {
    const [accessType, setAccessType] = useState(template.access_type)
    const [pinCode, setPinCode] = useState(template.pin_code || '')
    const [isActive, setIsActive] = useState(template.is_active)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        const changed =
            accessType !== template.access_type ||
            pinCode !== (template.pin_code || '') ||
            isActive !== template.is_active
        setHasChanges(changed)
    }, [accessType, pinCode, isActive, template])

    const handleSave = () => {
        onUpdate({
            access_type: accessType,
            pin_code: accessType === 'pin' ? pinCode : null,
            is_active: isActive
        })
    }

    return (
        <tr className={`hover:bg-gray-50 ${!isActive ? 'opacity-50' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {template.template_name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{template.template_name}</div>
                        <div className="text-sm text-gray-500">{template.template_id}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value as 'free' | 'pro' | 'pin')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                    <option value="free">🟢 Free</option>
                    <option value="pro">👑 Pro</option>
                    <option value="pin">🔑 PIN</option>
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {accessType === 'pin' ? (
                    <input
                        type="text"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        placeholder="Masukkan PIN"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                        maxLength={10}
                    />
                ) : (
                    <span className="text-gray-400 text-sm">—</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${hasChanges
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Simpan
                </button>
            </td>
        </tr>
    )
}
