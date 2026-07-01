'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { getTemplatePreview } from './actions'

type TemplateType = 'create_card' | 'upgrade_pro' | 'complete_profile' | 'custom'

export default function BroadcastEmailPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchBroadcastTargetUsers } = useAdmin()
  const router = useRouter()

  const [templateType, setTemplateType] = useState<TemplateType>('create_card')
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  
  const [targets, setTargets] = useState<{ id: string, email: string, full_name: string }[]>([])
  const [loadingTargets, setLoadingTargets] = useState(false)
  
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalSuccess, setTotalSuccess] = useState(0)
  const [totalFailed, setTotalFailed] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [preview, setPreview] = useState<{ subject: string, html: string } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'APP_ADMIN')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    loadTargets()
  }, [templateType])

  useEffect(() => {
    const loadPreview = async () => {
      const p = await getTemplatePreview(templateType, customSubject, customMessage)
      setPreview(p)
    }
    
    // Add simple debounce for custom inputs
    const timer = setTimeout(() => {
      loadPreview()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [templateType, customSubject, customMessage])

  const loadTargets = async () => {
    setLoadingTargets(true)
    const data = await fetchBroadcastTargetUsers(templateType)
    setTargets(data)
    setLoadingTargets(false)
  }

  const startBroadcast = async () => {
    if (targets.length === 0) {
      setMessage({ type: 'error', text: 'Tidak ada target penerima.' })
      return
    }
    
    if (templateType === 'custom' && (!customSubject || !customMessage)) {
      setMessage({ type: 'error', text: 'Subjek dan pesan harus diisi untuk email kustom.' })
      return
    }

    const confirm = window.confirm(`Anda yakin ingin mengirim email ke ${targets.length} pengguna? Tab ini harus tetap terbuka selama proses pengiriman.`)
    if (!confirm) return

    setIsBroadcasting(true)
    setProgress(0)
    setTotalSuccess(0)
    setTotalFailed(0)
    setErrors([])
    setMessage(null)

    const chunkSize = 10
    const chunks = []
    
    for (let i = 0; i < targets.length; i += chunkSize) {
      chunks.push(targets.slice(i, i + chunkSize))
    }

    let successCount = 0
    let failedCount = 0
    const allErrors: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      try {
        const response = await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            users: chunks[i],
            type: templateType,
            customSubject: templateType === 'custom' ? customSubject : undefined,
            customMessage: templateType === 'custom' ? customMessage : undefined,
          })
        })

        const result = await response.json()
        
        if (result.success) {
          successCount += result.data.successCount
          failedCount += result.data.failedCount
          if (result.data.errors && result.data.errors.length > 0) {
            allErrors.push(...result.data.errors)
          }
        } else {
          failedCount += chunks[i].length
          allErrors.push(result.error || 'Unknown error occurred')
        }
      } catch (err: any) {
        failedCount += chunks[i].length
        allErrors.push(err.message || 'Request failed')
      }

      setTotalSuccess(successCount)
      setTotalFailed(failedCount)
      setProgress(Math.round(((i + 1) / chunks.length) * 100))
    }

    setIsBroadcasting(false)
    setErrors(allErrors)
    setMessage({ 
      type: 'success', 
      text: `Broadcast selesai. Berhasil: ${successCount}, Gagal: ${failedCount}` 
    })
  }

  if (authLoading) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/dashboard/admin" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            &larr; Kembali ke Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast Email</h1>
          <p className="text-gray-500">Kirim email masal ke pengguna</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pilih Template Email
          </label>
          <select 
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as TemplateType)}
            disabled={isBroadcasting}
            className="w-full rounded-xl border border-gray-300 p-3"
          >
            <option value="create_card">Ajakan Buat Kartu (User Tanpa Kartu)</option>
            <option value="upgrade_pro">Ajakan Upgrade PRO (User Free, Ada Kartu)</option>
            <option value="complete_profile">Lengkapi Profil Foto (User Tanpa Foto)</option>
            <option value="custom">Pesan Kustom (Semua User)</option>
          </select>
        </div>

        {templateType === 'custom' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subjek Email
              </label>
              <input 
                type="text" 
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                disabled={isBroadcasting}
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="Misal: Promo Spesial Hari Ini!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pesan (HTML didukung)
              </label>
              <textarea 
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                disabled={isBroadcasting}
                rows={10}
                className="w-full rounded-xl border border-gray-300 p-3"
                placeholder="Gunakan {{name}} untuk menampilkan nama lengkap pengguna."
              />
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Target Penerima</p>
            {loadingTargets ? (
              <p className="text-2xl font-bold text-blue-900">Menghitung...</p>
            ) : (
              <p className="text-2xl font-bold text-blue-900">{targets.length} Pengguna</p>
            )}
          </div>
          <button
            onClick={startBroadcast}
            disabled={isBroadcasting || targets.length === 0 || loadingTargets}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {isBroadcasting ? 'Mengirim...' : 'Mulai Broadcast'}
          </button>
        </div>

        {isBroadcasting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress Pengiriman</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 text-center">Jangan tutup tab ini sampai proses selesai!</p>
          </div>
        )}

        {(totalSuccess > 0 || totalFailed > 0) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-sm text-green-600">Berhasil Dikirim</p>
              <p className="text-2xl font-bold text-green-800">{totalSuccess}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl text-center">
              <p className="text-sm text-red-600">Gagal Dikirim</p>
              <p className="text-2xl font-bold text-red-800">{totalFailed}</p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h3 className="text-sm font-bold text-red-800 mb-2">Error Logs:</h3>
            <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
              {errors.slice(0, 10).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
              {errors.length > 10 && (
                <li>... dan {errors.length - 10} error lainnya.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {preview && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Draft Template Email (Preview)</h2>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Subjek:</p>
            <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {preview.subject}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Isi Email:</p>
            <div 
              className="border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-y-auto bg-gray-50"
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
