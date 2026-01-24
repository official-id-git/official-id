'use client'

import { useState } from 'react'
import { createBlog, updateBlog, Blog } from '@/lib/actions/blog'
import { toast } from 'sonner'

interface BlogEditorProps {
    blog: Blog | null
    onClose: (refresh?: boolean) => void
}

export function BlogEditor({ blog, onClose }: BlogEditorProps) {
    const [formData, setFormData] = useState({
        title: blog?.title || '',
        slug: blog?.slug || '',
        content: blog?.content || '',
        excerpt: blog?.excerpt || '',
        image_url: blog?.image_url || '',
        meta_title: blog?.meta_title || '',
        meta_description: blog?.meta_description || '',
        keywords: blog?.keywords?.join(', ') || '',
        published: blog?.published || false,
    })
    const [saving, setSaving] = useState(false)

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Auto-generate slug from title if slug is empty
        if (field === 'title' && !formData.slug && !blog) {
            setFormData(prev => ({
                ...prev,
                slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const payload = {
                ...formData,
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
            }

            if (blog) {
                await updateBlog(blog.id, payload)
                toast.success('Blog updated successfully')
            } else {
                await createBlog(payload)
                toast.success('Blog created successfully')
            }
            onClose(true)
        } catch (error) {
            console.error('Error saving blog:', error)
            toast.error('Failed to save blog')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">{blog ? 'Edit Blog' : 'Create New Blog'}</h3>
                <button onClick={() => onClose()} className="text-gray-500 hover:text-gray-700">
                    Cancel
                </button>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => handleChange('title', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={e => handleChange('slug', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={e => handleChange('image_url', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={e => handleChange('excerpt', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <h4 className="font-medium text-gray-900">SEO Metadata</h4>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                    <input
                                        type="text"
                                        value={formData.meta_title}
                                        onChange={e => handleChange('meta_title', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                                    <textarea
                                        value={formData.meta_description}
                                        onChange={e => handleChange('meta_description', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
                                    <textarea
                                        value={formData.keywords}
                                        onChange={e => handleChange('keywords', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="published"
                                    checked={formData.published}
                                    onChange={e => handleChange('published', e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                                    Publish Immediately
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content (Markdown supported) *</label>
                        <textarea
                            required
                            value={formData.content}
                            onChange={e => handleChange('content', e.target.value)}
                            rows={15}
                            className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                        />
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-4 py-2 border text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Blog'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
