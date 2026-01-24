'use client'

import { useState, useEffect } from 'react'
import { getBlogs, deleteBlog, Blog } from '@/lib/actions/blog'
import { toast } from 'sonner'
import Link from 'next/link'
import { BlogEditor } from './BlogEditor'

export function BlogTab() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)

    useEffect(() => {
        loadBlogs()
    }, [])

    const loadBlogs = async () => {
        try {
            setLoading(true)
            // fetch all blogs (including unpublished) for admin
            const data = await getBlogs(false)
            setBlogs(data)
        } catch (error) {
            console.error('Error loading blogs:', error)
            toast.error('Failed to load blogs')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blog?')) return

        try {
            await deleteBlog(id)
            setBlogs(prev => prev.filter(b => b.id !== id))
            toast.success('Blog deleted')
        } catch (error) {
            toast.error('Failed to delete blog')
        }
    }

    const handleCreate = () => {
        setSelectedBlog(null)
        setIsEditing(true)
    }

    const handleEdit = (blog: Blog) => {
        setSelectedBlog(blog)
        setIsEditing(true)
    }

    const handleCloseEditor = (refresh?: boolean) => {
        setIsEditing(false)
        setSelectedBlog(null)
        if (refresh) {
            loadBlogs()
        }
    }

    if (isEditing) {
        return <BlogEditor blog={selectedBlog} onClose={handleCloseEditor} />
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-gray-900">Blog Management</h3>
                    <p className="text-sm text-gray-500">Kelola artikel dan blog post</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                    + New Post
                </button>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : blogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No blogs found. Create one!</div>
                ) : (
                    blogs.map(blog => (
                        <div key={blog.id} className="p-6 hover:bg-gray-50 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-base font-semibold text-gray-900">{blog.title}</h4>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${blog.published
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {blog.published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2 truncate max-w-lg">{blog.excerpt || 'No excerpt'}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span>Slug: {blog.slug}</span>
                                    <span>Created: {new Date(blog.created_at).toLocaleDateString()}</span>
                                    {blog.published && (
                                        <Link href={`/blog/${blog.slug}`} target="_blank" className="text-blue-500 hover:underline">
                                            View Live
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(blog)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(blog.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
