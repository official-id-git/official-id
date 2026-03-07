'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import BottomNavigation from '@/components/layout/BottomNavigation'
import { showToast } from '@/hooks/useToast'
import type { OrganizationRepository } from '@/types'
import { FileDown, FileText, Film, FileBox, ExternalLink, Download } from 'lucide-react'

// Simple helper to guess icon based on name or mime
function getFileIcon(type: string, title: string) {
    const mimeStr = type.toLowerCase()
    const titleStr = title.toLowerCase()
    if (mimeStr.includes('video') || titleStr.includes('mp4') || titleStr.includes('mov')) return <Film className="w-6 h-6 text-purple-500" />
    if (mimeStr.includes('pdf') || titleStr.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />
    if (mimeStr.includes('sheet') || titleStr.includes('excel')) return <FileBox className="w-6 h-6 text-green-500" />
    if (mimeStr.includes('word') || titleStr.includes('docx')) return <FileText className="w-6 h-6 text-blue-500" />
    if (mimeStr.includes('presentation') || titleStr.includes('pptx')) return <FileBox className="w-6 h-6 text-orange-500" />
    return <FileText className="w-6 h-6 text-gray-500" />
}

export default function RepositoryManagementPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { checkMembership } = useOrganizations()
    const orgId = params.id as string

    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [repositories, setRepositories] = useState<OrganizationRepository[]>([])

    // Upload Form State
    const [uploading, setUploading] = useState(false)
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (user && orgId) {
            checkAccess()
            fetchRepositories()
        }
    }, [user, orgId])

    const checkAccess = async () => {
        const membership = await checkMembership(orgId)
        // Needs to be admin or owner
        if (!membership.isAdmin && !membership.isOwner) {
            showToast('You do not have permission', 'error')
            router.push(`/dashboard/organizations/${orgId}`)
            return
        }
        setIsAdmin(true)
    }

    const fetchRepositories = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/organizations/${orgId}/repository`)
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            if (data.success) {
                setRepositories(data.data)
            } else {
                showToast(data.error || 'Failed to load repositories', 'error')
            }
        } catch (err: any) {
            console.error(err)
            showToast('Error loading repositories', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0]
            // Add more strict client size/type checking here if needed
            setFile(selectedFile)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !file) {
            showToast('Mohon isi judul dan pilih file', 'error')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('file', file)

            const res = await fetch(`/api/organizations/${orgId}/repository`, {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (data.success) {
                showToast('File berhasil diupload', 'success')
                setTitle('')
                setFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
                // Refresh list
                fetchRepositories()
            } else {
                showToast(data.error || 'Upload gagal', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Terjadi kesalahan saat upload', 'error')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAdmin) return null // Handled in checkAccess

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link href={`/dashboard/organizations/${orgId}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
                        ← Back to Circle
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
                            <FileDown className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Repository Management</h1>
                            <p className="text-gray-500 text-sm">Kelola file dan dokumen (Google Drive) eksklusif untuk member Circle</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Upload Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileBox className="w-5 h-5 text-gray-400" />
                                Upload File Baru
                            </h2>

                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Judul File
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: Materi Webinar Q1"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        disabled={uploading}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Judul akan menjadi nama folder di Google Drive.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pilih File
                                    </label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.mp4,.mov,.docx,.xlsx,.pptx"
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 p-1 border border-gray-200 rounded-xl"
                                        disabled={uploading}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Format: MP4, MOV, PDF, DOCX, EXCEL, PPTX
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={uploading || !title || !file}
                                        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Mengupload...
                                            </>
                                        ) : (
                                            <>
                                                <FileDown className="w-5 h-5" />
                                                Upload File
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column - Repo List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">Daftar Repository</h2>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                                    {repositories.length} File
                                </span>
                            </div>

                            {repositories.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileBox className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <p>Belum ada file repository yang diupload.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full whitespace-nowrap">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Upload</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diunduh</th>
                                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {repositories.map((repo) => (
                                                <tr key={repo.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {getFileIcon(repo.file_type, repo.title)}
                                                            <div className="max-w-[200px] truncate font-medium text-gray-900" title={repo.title}>
                                                                {repo.title}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium uppercase truncate block max-w-[100px]" title={repo.file_type}>
                                                            {repo.file_type.split('/').pop()?.slice(0, 10) || 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(repo.created_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric', month: 'short', year: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                                                            <Download className="w-4 h-4 text-gray-400" />
                                                            {repo.download_count}x
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        {(repo.gdrive_web_view_link || repo.gdrive_web_content_link) && (
                                                            <a
                                                                href={repo.gdrive_web_view_link || repo.gdrive_web_content_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Buka di GDrive"
                                                            >
                                                                <ExternalLink className="w-5 h-5" />
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => navigator.clipboard.writeText(`https://official.id/api/repositories/${repo.id}/download`).then(() => showToast('Link tersalin!', 'success'))}
                                                            className="inline-flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Copy Download Link"
                                                        >
                                                            <Link href="#" className="w-5 h-5" />
                                                        </button>
                                                        {/* Deletion left as exercise for separate endpoint if needed, or simply not required by prompt right now */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>

            <BottomNavigation variant="organizations" />
        </div>
    )
}
