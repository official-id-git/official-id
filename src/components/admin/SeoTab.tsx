'use client'

import { useState, useEffect } from 'react'
import { getSeoSettings, updateSeoSettings, SeoSettings } from '@/lib/actions/seo'
import { toast } from 'sonner'

export function SeoTab() {
    const [settings, setSettings] = useState<SeoSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const data = await getSeoSettings()

            // Default fallback if no data
            const defaultData: SeoSettings = {
                id: 1,
                site_title: 'Official ID - Ekosistem Digital untuk Profesional',
                site_description: 'Platform kartu bisnis digital, networking, dan organisasi untuk profesional Indonesia',
                keywords: ["official id", "kartu nama digital", "bisnis", "profesional"],
                updated_at: new Date().toISOString()
            }

            setSettings(data || defaultData)
        } catch (error) {
            console.error('Error loading SEO settings:', error)
            toast.error('Failed to load SEO settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!settings) return

        setSaving(true)
        try {
            await updateSeoSettings({
                site_title: settings.site_title,
                site_description: settings.site_description,
                keywords: settings.keywords,
            })
            toast.success('SEO settings updated successfully')
        } catch (error) {
            console.error('Error updating SEO settings:', error)
            toast.error('Failed to update SEO settings')
        } finally {
            setSaving(false)
        }
    }

    const handleKeywordChange = (value: string) => {
        if (!settings) return
        const keywords = value.split(',').map(k => k.trim()).filter(k => k)
        setSettings({ ...settings, keywords })
    }

    if (loading) {
        return <div className="text-center py-8">Loading settings...</div>
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900">SEO Management</h3>
                <p className="text-sm text-gray-500">Optimasi Search Engine untuk Website Utama</p>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={settings?.site_title || ''}
                            onChange={e => setSettings(prev => prev ? { ...prev, site_title: e.target.value } : null)}
                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Judul yang akan tampil di tab browser dan hasil pencarian Google.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Site Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={settings?.site_description || ''}
                            onChange={e => setSettings(prev => prev ? { ...prev, site_description: e.target.value } : null)}
                            rows={3}
                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Deskripsi singkat yang muncul di bawah judul pada hasil pencarian.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keywords (Login-separated) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={settings?.keywords.join(', ') || ''}
                            onChange={e => handleKeywordChange(e.target.value)}
                            rows={4}
                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="official id, kartu nama digital, ..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Kata kunci yang relevan untuk membantu Google menemukan website ini. Pisahkan dengan koma.</p>
                    </div>

                    <div className="pt-4 border-t flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
