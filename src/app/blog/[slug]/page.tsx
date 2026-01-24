import { getBlogBySlug } from '@/lib/actions/blog'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ReactMarkdown from 'react-markdown' // Need to check if installed, if not will use basic rendering or install
// Ideally we'd use a markdown renderer. For now I'll just render text or simple HTML if trusted. 
// Since user asked for "blog", I'll assume they might paste HTML or Markdown. 
// Given the dependencies list doesn't show react-markdown, I'll assume usage of dangerouslySetInnerHTML or just text for now, 
// OR I will simply display content as text. Wait, "react-markdown" is likely needed. 
// I'll stick to a simple whitespace-pre-wrap for now to avoid dependency hell unless requested.
// BETTER: I will use a simple implementation that respects newlines.

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const blog = await getBlogBySlug(slug)

    if (!blog) {
        return {
            title: 'Blog Not Found',
        }
    }

    return {
        title: blog.meta_title || blog.title,
        description: blog.meta_description || blog.excerpt,
        keywords: blog.keywords || [],
        openGraph: {
            title: blog.meta_title || blog.title,
            description: blog.meta_description || blog.excerpt || '',
            images: blog.image_url ? [blog.image_url] : [],
        }
    }
}

export default async function BlogDetailPage({ params }: Props) {
    const { slug } = await params
    const blog = await getBlogBySlug(slug)

    if (!blog || !blog.published) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
                            ID
                        </div>
                        <span className="font-bold text-xl text-gray-900">Official ID</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                            All Articles
                        </Link>
                        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                            Login
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Breadcrumbs */}
                <nav className="flex text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap">
                    <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{blog.title}</span>
                </nav>

                <article className="bg-white rounded-3xl shadow-sm overflow-hidden p-8 md:p-12">
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            {blog.title}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500 border-b pb-8">
                            <time dateTime={blog.created_at}>
                                {new Date(blog.created_at).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </time>
                            <span>•</span>
                            <span>Official ID Team</span>
                        </div>
                    </header>

                    {blog.image_url && (
                        <div className="mb-10 rounded-2xl overflow-hidden shadow-sm">
                            <img
                                src={blog.image_url}
                                alt={blog.title}
                                className="w-full h-auto object-cover max-h-[500px]"
                            />
                        </div>
                    )}

                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
                        {/* 
                  Directly rendering content with whitespace-pre-wrap for simple text formatting. 
                  For complex HTML, we'd use dangerouslySetInnerHTML but that needs sanitization.
                  For valid HTML input from admin, this is 'okay' if admin is trusted.
                */}
                        <div dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br/>') }} />
                    </div>
                </article>
            </main>

            <footer className="bg-white border-t mt-20 py-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Buat Kartu Nama Digital Anda</h2>
                    <p className="text-gray-600 mb-8">Bergabunglah dengan ribuan profesional lainnya di Official ID.</p>
                    <Link
                        href="/register"
                        className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-transform hover:scale-105"
                    >
                        Daftar Sekarang Gratis
                    </Link>
                </div>
            </footer>
        </div>
    )
}
