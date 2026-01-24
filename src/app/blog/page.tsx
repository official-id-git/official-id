import { getBlogs } from '@/lib/actions/blog'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blog & Networking Tips | Official ID',
    description: 'Artikel dan tips seputar networking profesional, kartu nama digital, dan pengembangan bisnis.',
}

export default async function BlogPage() {
    const blogs = await getBlogs(true)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                            ID
                        </div>
                        <span className="font-bold text-xl text-gray-900">Official ID</span>
                    </Link>
                    <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                        Login
                    </Link>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog & Insights</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Tips dan wawasan terbaru seputar networking, branding profesional, dan teknologi kartu nama digital.
                    </p>
                </div>

                {blogs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Belum ada artikel yang dipublikasikan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map(blog => (
                            <Link
                                href={`/blog/${blog.slug}`}
                                key={blog.id}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 block"
                            >
                                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                    {blog.image_url ? (
                                        <img
                                            src={blog.image_url}
                                            alt={blog.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {blog.title}
                                    </h2>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                                        {blog.excerpt || 'Baca selengkapnya...'}
                                    </p>
                                    <div className="text-xs text-gray-400">
                                        {new Date(blog.created_at).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
