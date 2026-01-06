import { SeoForm } from '@/components/admin/SeoForm'
import { getSeoSettings } from '@/lib/actions/seo'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Pengaturan SEO | Official ID Admin',
}

export default async function AdminSeoPage() {
    const settings = await getSeoSettings()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan SEO Global</h1>
                <p className="text-gray-500">Kelola meta tags dan open graph images untuk website utama.</p>
            </div>

            <SeoForm initialSettings={settings} />
        </div>
    )
}
