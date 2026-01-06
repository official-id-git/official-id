'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useContacts, Contact, ContactInsert } from '@/hooks/useContacts'
import { Scan, UserPlus, Send, Mail, Info } from 'lucide-react'
import { useCards } from '@/hooks/useCards'
import { ImageUpload } from '@/components/ui/ImageUpload'
import BottomNavigation from '@/components/layout/BottomNavigation'
import type { BusinessCard } from '@/types'

export default function ContactsPage() {
  const { user, loading: authLoading } = useAuth()
  const { fetchContacts, addContact, deleteContact, scanBusinessCard, sendCardToContact, loading } = useContacts()
  const { fetchCards } = useCards()
  const router = useRouter()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [cards, setCards] = useState<BusinessCard[]>([])
  const [showScanModal, setShowScanModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [scanImageUrl, setScanImageUrl] = useState('')
  const [scanResult, setScanResult] = useState<Partial<ContactInsert> | null>(null)
  const [scanRawText, setScanRawText] = useState('')
  const [scanning, setScanning] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState<ContactInsert>({
    name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    source: 'manual'
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    const [contactsData, cardsData] = await Promise.all([
      fetchContacts(),
      fetchCards()
    ])
    setContacts(contactsData)
    setCards(cardsData)
  }

  const handleScan = async () => {
    if (!scanImageUrl) return
    setScanning(true)

    const result = await scanBusinessCard(scanImageUrl)

    if (result.success && result.contact) {
      setScanResult(result.contact)
      setScanRawText(result.rawText || '')
      setFormData({
        name: result.contact.name || '',
        email: result.contact.email || '',
        phone: result.contact.phone || '',
        company: result.contact.company || '',
        job_title: result.contact.job_title || '',
        source: 'scan',
        scanned_image_url: scanImageUrl
      })
    } else {
      setMessage({ type: 'error', text: result.error || 'Gagal scan kartu' })
    }
    setScanning(false)
  }

  const handleAddContact = async () => {
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Nama wajib diisi' })
      return
    }

    const newContact = await addContact(formData)
    if (newContact) {
      setMessage({ type: 'success', text: 'Kontak berhasil ditambahkan' })
      loadData()
      resetForm()
      setShowAddModal(false)
      setShowScanModal(false)
    } else {
      setMessage({ type: 'error', text: 'Gagal menambahkan kontak' })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Hapus kontak ${contact.name}?`)) return

    const success = await deleteContact(contact.id)
    if (success) {
      setMessage({ type: 'success', text: 'Kontak berhasil dihapus' })
      loadData()
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSendCard = async (cardId: string, customMessage?: string) => {
    if (!selectedContact) return

    const success = await sendCardToContact(selectedContact.id, cardId, customMessage)
    if (success) {
      setMessage({ type: 'success', text: `Kartu berhasil dikirim ke ${selectedContact.email}` })
      loadData()
    } else {
      setMessage({ type: 'error', text: 'Gagal mengirim kartu' })
    }
    setShowSendModal(false)
    setSelectedContact(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      source: 'manual'
    })
    setScanImageUrl('')
    setScanResult(null)
    setScanRawText('')
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kontak Potensial</h1>
              <p className="text-sm text-gray-500">{contacts.length} kontak</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowScanModal(true)}
                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                title="Scan Kartu Nama"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                title="Tambah Manual"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* New Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Tambah Kontak Mudah</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Gunakan tombol <span className="font-medium text-purple-700"><Scan className="w-3 h-3 inline mx-1" /> Scan</span> di atas untuk memindai kartu nama fisik secara otomatis, atau <span className="font-medium text-blue-700"><UserPlus className="w-3 h-3 inline mx-1" /> Tambah Manual</span> untuk input data langsung.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Kirim Kartu Digital</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Kirim kartu nama digital Anda ke kontak yang tersimpan menggunakan email profesional. Anda juga dapat menyertakan <span className="font-medium text-gray-900">pesan personal</span> saat mengirim.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Contact List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Kontak</h3>
            <p className="text-gray-500 mb-4">Scan kartu nama fisik atau tambahkan kontak secara manual</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowScanModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
              >
                Scan Kartu Nama
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Tambah Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${contact.source === 'scan' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                      <span className={`text-lg font-semibold ${contact.source === 'scan' ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{contact.name}</p>
                      {contact.job_title && (
                        <p className="text-sm text-gray-500">{contact.job_title}</p>
                      )}
                      {contact.company && (
                        <p className="text-sm text-gray-500">{contact.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {contact.source === 'scan' && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Scan
                      </span>
                    )}
                    {contact.email_sent && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Terkirim
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {contact.phone}
                    </a>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t flex gap-2">
                  {contact.email && !contact.email_sent && cards.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedContact(contact)
                        setShowSendModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Kirim Kartu
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(contact)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Scan Kartu Nama</h3>
              <button onClick={() => { setShowScanModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!scanResult ? (
              <>
                <p className="text-gray-600 mb-4">Upload foto kartu nama fisik untuk di-scan</p>
                <ImageUpload
                  currentImageUrl={scanImageUrl}
                  onImageUploaded={setScanImageUrl}
                  folder="scans"
                  label="Foto Kartu Nama"
                />
                <button
                  onClick={handleScan}
                  disabled={!scanImageUrl || scanning}
                  className="w-full mt-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {scanning ? 'Memproses...' : 'Scan Kartu'}
                </button>
              </>
            ) : (
              <>
                <p className="text-green-600 mb-4">✓ Data berhasil di-extract. Periksa dan simpan:</p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nama *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Telepon"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Perusahaan"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Jabatan"
                    value={formData.job_title || ''}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {scanRawText && (
                  <details className="mt-4">
                    <summary className="text-sm text-gray-500 cursor-pointer">Lihat teks mentah</summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded-xl text-xs overflow-auto max-h-32">{scanRawText}</pre>
                  </details>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => { setScanResult(null); resetForm(); }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl"
                  >
                    Scan Ulang
                  </button>
                  <button
                    onClick={handleAddContact}
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Kontak'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Manual Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tambah Kontak</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nama *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Telepon"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Perusahaan"
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Jabatan"
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleAddContact}
              disabled={loading || !formData.name}
              className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kontak'}
            </button>
          </div>
        </div>
      )}

      {/* Send Card Modal */}
      {showSendModal && selectedContact && (
        <SendCardModal
          contact={selectedContact}
          cards={cards}
          onSend={handleSendCard}
          onClose={() => { setShowSendModal(false); setSelectedContact(null); }}
          loading={loading}
        />
      )}

      <BottomNavigation variant="main" />
    </div>
  )
}

// Send Card Modal Component
function SendCardModal({
  contact,
  cards,
  onSend,
  onClose,
  loading
}: {
  contact: Contact
  cards: BusinessCard[]
  onSend: (cardId: string, message?: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id || '')
  const [message, setMessage] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Kirim Kartu ke {contact.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Kartu akan dikirim ke <strong>{contact.email}</strong>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kartu</label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.full_name} - {card.job_title || card.company || 'Kartu'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pesan (opsional)</label>
            <textarea
              placeholder="Tambahkan pesan personal..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl"
          >
            Batal
          </button>
          <button
            onClick={() => onSend(selectedCardId, message)}
            disabled={loading || !selectedCardId}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Email'}
          </button>
        </div>
      </div>
    </div>
  )
}
