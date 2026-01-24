import { BlogTab } from '@/components/admin/BlogTab'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Manajemen Blog | Official ID Admin',
}

export default function AdminBlogPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manajemen Blog & Artikel</h1>
                <p className="text-gray-500">Kelola konten artikel yang akan ditampilkan di halaman blog.</p>
            </div>

            <BlogTab />
        </div>
    )
}
