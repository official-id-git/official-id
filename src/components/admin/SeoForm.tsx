'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSeoSettings, type SeoSettings } from '@/lib/actions/seo'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { toast } from 'sonner'

interface SeoFormProps {
    initialSettings: SeoSettings | null
}

export function SeoForm({ initialSettings }: SeoFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<SeoSettings>>(
        initialSettings || {
            site_title: '',
            site_description: '',
            keywords: [],
            og_image_google: '',
            og_image_twitter: '',
            og_image_facebook: '',
            og_image_linkedin: '',
        }
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setFormData((prev) => ({ ...prev, keywords: value.split(',').map((k) => k.trim()) }))
    }

    const handleImageChange = (key: keyof SeoSettings) => (url: string) => {
        setFormData((prev) => ({ ...prev, [key]: url }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await updateSeoSettings(formData)
            toast.success('Pengaturan SEO berhasil disimpan')
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error('Gagal menyimpan pengaturan SEO')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informasi Dasar</h3>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Website (Meta Title)
                    </label>
                    <input
                        type="text"
                        name="site_title"
                        value={formData.site_title}
                        onChange={handleChange}
                        placeholder="Contoh: Official ID - Ekosistem Digital..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi Website (Meta Description)
                    </label>
                    <textarea
                        name="site_description"
                        rows={3}
                        value={formData.site_description}
                        onChange={handleChange}
                        placeholder="Deskripsi singkat tentang website untuk mesin pencari..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Keywords (Pisahkan dengan koma)
                    </label>
                    <input
                        type="text"
                        name="keywords"
                        value={formData.keywords?.join(', ')}
                        onChange={handleKeywordsChange}
                        placeholder="kartu nama, digital, bisnis, profesional..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Open Graph Images</h3>
                <p className="text-sm text-gray-500">
                    Upload gambar untuk preview saat link dibagikan di sosial media.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ImageUpload
                        label="Google / Default OG Image"
                        folder="seo"
                        value={formData.og_image_google}
                        onChange={handleImageChange('og_image_google')}
                    />

                    <ImageUpload
                        label="Twitter / X Card Image"
                        folder="seo"
                        value={formData.og_image_twitter}
                        onChange={handleImageChange('og_image_twitter')}
                    />

                    <ImageUpload
                        label="Facebook OG Image"
                        folder="seo"
                        value={formData.og_image_facebook}
                        onChange={handleImageChange('og_image_facebook')}
                    />

                    <ImageUpload
                        label="LinkedIn OG Image"
                        folder="seo"
                        value={formData.og_image_linkedin}
                        onChange={handleImageChange('og_image_linkedin')}
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        'Simpan Pengaturan'
                    )}
                </button>
            </div>
        </form>
    )
}
