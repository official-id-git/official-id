'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useEvents } from '@/hooks/useEvents'
import BottomNavigation from '@/components/layout/BottomNavigation'
import { showToast } from '@/hooks/useToast'
import type { OrganizationRepository, CircleEvent } from '@/types'
import { FileDown, FileText, Film, FileBox, ExternalLink, Download, Trash2, FolderPlus } from 'lucide-react'

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
    const { fetchEvents: fetchOrgEvents } = useEvents()
    const orgId = params.id as string

    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [repositories, setRepositories] = useState<OrganizationRepository[]>([])
    const [events, setEvents] = useState<CircleEvent[]>([])

    // Upload Form State
    const [uploading, setUploading] = useState(false)
    const [title, setTitle] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [eventId, setEventId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Delete Confirmation State
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        if (user && orgId) {
            checkAccess()
            fetchRepositories()
            fetchEvents()
        }
    }, [user, orgId])

    const checkAccess = async () => {
        const membership = await checkMembership(orgId)
        // Set info if they are admin or owner. Members are allowed to view the list, but not upload.
        if (membership.isAdmin || membership.isOwner) {
            setIsAdmin(true)
        }
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

    const fetchEvents = async () => {
        try {
            const evts = await fetchOrgEvents(orgId)
            setEvents(evts || [])
        } catch (err) {
            console.error('Error fetching events:', err)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0]

            // Client-side file size constraint (10 MB)
            const MAX_SIZE_MB = 10
            if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
                showToast(`Ukuran maksimal file adalah ${MAX_SIZE_MB}MB`, 'error')
                e.target.value = ''
                return
            }

            setFile(selectedFile)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !file || !categoryId || !eventId) {
            showToast('Mohon isi judul file, kategori, event terkait, dan pilih file', 'error')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('file', file)
            formData.append('category', categoryId)
            formData.append('event_id', eventId)

            const res = await fetch(`/api/organizations/${orgId}/repository`, {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (data.success) {
                showToast('File berhasil diupload', 'success')
                setTitle('')
                setCategoryId('')
                setEventId('')
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

    const handleDelete = async (repoId: string) => {
        if (!confirm('Apakah Yakin Ingin Menghapus File Ini? File juga akan terhapus dari Google Drive (Jika Anda Sebagai Pihak yang Terotorisasi).')) return;

        setDeletingId(repoId)
        try {
            const res = await fetch(`/api/organizations/${orgId}/repository?repoId=${repoId}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (data.success) {
                showToast('File berhasil dihapus', 'success')
                fetchRepositories() // refresh the table
            } else {
                showToast(data.error || 'Gagal menghapus file', 'error')
            }
        } catch (err) {
            console.error(err)
            showToast('Error menghubungi server.', 'error')
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

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
                    {isAdmin && (
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FolderPlus className="w-5 h-5 text-gray-400" />
                                    Upload File Baru
                                </h2>

                                <form onSubmit={handleUpload} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Judul Event terkait
                                        </label>
                                        <select
                                            value={eventId}
                                            onChange={(e) => setEventId(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            disabled={uploading}
                                            required
                                        >
                                            <option value="">-- Pilih Event --</option>
                                            {events.map((event) => (
                                                <option key={event.id} value={event.id}>
                                                    {event.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Kategori File
                                        </label>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            disabled={uploading}
                                            required
                                        >
                                            <option value="">-- Pilih Kategori --</option>
                                            <option value="Video">Video Rekaman</option>
                                            <option value="e-Certificate">e-Certificate</option>
                                            <option value="Materi">Materi Presentasi (PPTX/PDF/DOCX)</option>
                                            <option value="Dokumentasi">Dokumentasi (Foto dll)</option>
                                            <option value="Lainnya">File Lainnya</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nama Spesifik File
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Contoh: PPT Materi Narasumber Pak Budi"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            disabled={uploading}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pilih File
                                        </label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept=".pdf,.mp4,.mov,.docx,.xlsx,.pptx,.jpg,.png,.jpeg,.zip"
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 p-1 border border-gray-200 rounded-xl"
                                            disabled={uploading}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Maksimal 10MB. Format didukung beragam.
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={uploading || !title || !file || !eventId || !categoryId}
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
                    )}

                    {/* Right Column - Repo List */}
                    <div className={isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}>
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
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File & Kategori</th>
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
                                                            <div className="max-w-[200px]" title={repo.title}>
                                                                <div className="truncate font-medium text-gray-900">{repo.title}</div>
                                                                <div className="text-xs text-gray-500 font-medium tracking-wide">{repo.category || 'Lainnya'}</div>
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
                                                        {(repo.gdrive_web_view_link || repo.gdrive_web_content_link) && isAdmin && (
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
                                                        {isAdmin && (
                                                            <button
                                                                onClick={() => handleDelete(repo.id)}
                                                                disabled={deletingId === repo.id}
                                                                className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Hapus File"
                                                            >
                                                                {deletingId === repo.id ? (
                                                                    <div className="w-5 h-5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-5 h-5" />
                                                                )}
                                                            </button>
                                                        )}
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
