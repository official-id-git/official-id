'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useOrganizations } from '@/hooks/useOrganizations'
import { createClient } from '@/lib/supabase/client'
import SendMessageModal from '@/components/messages/SendMessageModal'
import { useSecurity } from '@/hooks/useSecurity'
import type { OrganizationMember, BusinessCard } from '@/types'

interface MemberListProps {
  members: OrganizationMember[]
  isAdmin: boolean
  onUpdate?: () => void
}

interface MemberWithUser extends OrganizationMember {
  users?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    business_cards?: BusinessCard[]
  }
}

export function MemberList({ members, isAdmin, onUpdate }: MemberListProps) {
  const { updateMemberStatus, removeMember } = useOrganizations()
  const { validateInput } = useSecurity()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null)
  const [memberCards, setMemberCards] = useState<BusinessCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const supabase = createClient()

  // Message modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [messageRecipient, setMessageRecipient] = useState<{ id: string; name: string } | null>(null)

  // Fetch member's business cards when modal opens
  useEffect(() => {
    if (selectedMember?.users?.id) {
      fetchMemberCards(selectedMember.users.id)
    } else {
      setMemberCards([])
    }
  }, [selectedMember])

  const fetchMemberCards = async (userId: string) => {
    setLoadingCards(true)
    try {
      console.log('Fetching cards for user:', userId)
      const { data, error } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching cards:', error)
        throw error
      }
      console.log('Cards fetched:', data)
      setMemberCards(data || [])
    } catch (err) {
      console.error('Error fetching member cards:', err)
      setMemberCards([])
    } finally {
      setLoadingCards(false)
    }
  }

  const handleApprove = async (memberId: string) => {
    setProcessingId(memberId)
    const success = await updateMemberStatus(memberId, 'APPROVED')
    if (success && onUpdate) {
      onUpdate()
    }
    setProcessingId(null)
  }

  const handleReject = async (memberId: string) => {
    if (!confirm('Yakin ingin menolak anggota ini?')) return
    setProcessingId(memberId)
    const success = await updateMemberStatus(memberId, 'REJECTED')
    if (success && onUpdate) {
      onUpdate()
    }
    setProcessingId(null)
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Yakin ingin menghapus anggota ini dari Circle?')) return
    setProcessingId(memberId)
    const success = await removeMember(memberId)
    if (success && onUpdate) {
      onUpdate()
    }
    setProcessingId(null)
    setSelectedMember(null)
  }

  const handleOpenMessage = (userId: string, userName: string) => {
    setMessageRecipient({ id: userId, name: userName })
    setMessageModalOpen(true)
  }

  // Filter members based on search query
  const filteredMembersList = members.filter(member => {
    if (!searchQuery.trim()) return true

    const m = member as MemberWithUser
    const query = searchQuery.toLowerCase()

    // Check name and email
    const nameMatch = m.users?.full_name?.toLowerCase().includes(query)
    const emailMatch = m.users?.email?.toLowerCase().includes(query)

    // Check business cards
    const businessCards = m.users?.business_cards || []
    const cardMatch = businessCards.some(card =>
      card.company?.toLowerCase().includes(query) ||
      card.city?.toLowerCase().includes(query) ||
      (card.business_description && card.business_description.toLowerCase().includes(query))
    )

    return nameMatch || emailMatch || cardMatch
  }).sort((a, b) => {
    const m1 = a as MemberWithUser
    const m2 = b as MemberWithUser
    const nameA = m1.users?.full_name?.toLowerCase() || ''
    const nameB = m2.users?.full_name?.toLowerCase() || ''

    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB)
    } else {
      return nameB.localeCompare(nameA)
    }
  })

  // Derived lists from filtered members
  const pendingMembers = filteredMembersList.filter(m => m.status === 'PENDING')
  const approvedMembers = filteredMembersList.filter(m => m.status === 'APPROVED')
  const rejectedMembers = filteredMembersList.filter(m => m.status === 'REJECTED')

  // Avatar component with fallback
  const Avatar = ({ user, size = 'md' }: { user?: MemberWithUser['users'], size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClass = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-16 h-16 text-2xl'
    }[size]

    if (user?.avatar_url) {
      return (
        <Image
          src={user.avatar_url}
          alt={user.full_name || 'Avatar'}
          width={size === 'lg' ? 64 : size === 'md' ? 40 : 32}
          height={size === 'lg' ? 64 : size === 'md' ? 40 : 32}
          className={`${sizeClass} rounded-full object-cover`}
        />
      )
    }

    return (
      <div className={`${sizeClass} bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center`}>
        <span className="text-blue-600 font-semibold">
          {user?.full_name?.charAt(0).toUpperCase() || '?'}
        </span>
      </div>
    )
  }

  // Mini card preview component
  const MiniCardPreview = ({ card }: { card: BusinessCard }) => {
    const template = card.template || 'professional'
    const bgColor = {
      professional: 'from-blue-500 to-blue-600',
      modern: 'from-gray-800 to-gray-900',
      minimal: 'from-gray-100 to-gray-200'
    }[template] || 'from-blue-500 to-blue-600'
    const textColor = template === 'minimal' ? 'text-gray-900' : 'text-white'

    return (
      <Link
        href={`/c/${card.id}`}
        className="block group"
      >
        <div className={`bg-gradient-to-br ${bgColor} rounded-xl p-3 shadow-sm hover:shadow-md transition-all group-hover:scale-[1.02]`}>
          <div className="flex items-center gap-3">
            {card.profile_photo_url ? (
              <img
                src={card.profile_photo_url}
                alt={card.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                onError={(e) => {
                  // Hide broken image
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${template === 'minimal' ? 'bg-gray-300' : 'bg-white/20'}`}>
                <span className={`font-semibold ${textColor}`}>
                  {card.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${textColor}`}>
                {card.full_name}
              </p>
              {card.job_title && (
                <p className={`text-xs truncate ${template === 'minimal' ? 'text-gray-600' : 'text-white/70'}`}>
                  {card.job_title}
                </p>
              )}
              {card.company && (
                <p className={`text-xs truncate ${template === 'minimal' ? 'text-gray-500' : 'text-white/60'}`}>
                  {card.company}
                </p>
              )}
            </div>
            <div className={`text-xs px-2 py-0.5 rounded-full capitalize ${template === 'minimal' ? 'bg-gray-200 text-gray-600' : 'bg-white/20 text-white/80'}`}>
              {template}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari anggota berdasarkan nama, email, perusahaan, kota, atau deskripsi..."
              value={searchQuery}
              onChange={async (e) => {
                const val = e.target.value
                const isValid = await validateInput(val)
                if (isValid) setSearchQuery(val)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white w-full sm:w-auto"
          >
            <option value="asc">Nama: A - Z</option>
            <option value="desc">Nama: Z - A</option>
          </select>
        </div>
      </div>

      {/* Pending Members */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Menunggu Persetujuan ({pendingMembers.length})
          </h3>
          <div className="space-y-3">
            {pendingMembers.map(member => {
              const m = member as MemberWithUser
              return (
                <div key={m.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <Avatar user={m.users} />
                    <div>
                      <p className="font-medium text-gray-900">{m.users?.full_name || 'Unknown'}</p>
                      <a
                        href={`mailto:${m.users?.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {m.users?.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(m.id)}
                      disabled={processingId === m.id}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReject(m.id)}
                      disabled={processingId === m.id}
                      className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-xl hover:bg-red-50 disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Approved Members */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Anggota ({approvedMembers.length})
        </h3>
        {approvedMembers.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500">Belum ada anggota</p>
          </div>
        ) : (
          <div className="space-y-2">
            {approvedMembers.map(member => {
              const m = member as MemberWithUser
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar user={m.users} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <span className="truncate">{m.users?.full_name || 'Unknown'}</span>
                        {m.is_admin && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                            Admin
                          </span>
                        )}
                      </p>
                      <a
                        href={`mailto:${m.users?.email}`}
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {m.users?.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                    {/* Message Button */}
                    <button
                      onClick={() => handleOpenMessage(m.users?.id || '', m.users?.full_name || '')}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Kirim Pesan"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedMember(m)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Rejected Members (Admin only) */}
      {isAdmin && rejectedMembers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Ditolak ({rejectedMembers.length})
          </h3>
          <div className="space-y-2">
            {rejectedMembers.map(member => {
              const m = member as MemberWithUser
              return (
                <div key={m.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                      <span className="text-red-700 font-medium">
                        {m.users?.full_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{m.users?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{m.users?.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-red-600">Ditolak</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Member Detail Modal with Business Cards */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Detail Anggota</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Section */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Avatar user={selectedMember.users} size="lg" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">
                  {selectedMember.users?.full_name || 'Unknown'}
                </h4>
                {selectedMember.is_admin && (
                  <span className="inline-block mt-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full">
                    Admin Circle
                  </span>
                )}
              </div>

              {/* Info Section */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <a
                      href={`mailto:${selectedMember.users?.email}`}
                      className="text-blue-600 hover:underline truncate block"
                    >
                      {selectedMember.users?.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Bergabung</p>
                    <p className="text-gray-900">
                      {selectedMember.joined_at
                        ? new Date(selectedMember.joined_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="text-green-600 font-medium">Aktif</p>
                  </div>
                </div>
              </div>

              {/* Business Cards Section */}
              <div className="border-t pt-6">
                <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Kartu Bisnis ({loadingCards ? '...' : memberCards.length})
                </h5>

                {loadingCards ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : memberCards.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-gray-500 text-sm">Belum memiliki kartu bisnis</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {memberCards.map(card => (
                      <MiniCardPreview key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleOpenMessage(selectedMember.users?.id || '', selectedMember.users?.full_name || '')
                    // Does not close modal, allows messaging while viewing details
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Kirim Pesan
                </button>
                {isAdmin && !selectedMember.is_admin && (
                  <button
                    onClick={() => handleRemove(selectedMember.id)}
                    disabled={processingId === selectedMember.id}
                    className="px-4 py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      <SendMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        recipientId={messageRecipient?.id || ''}
        recipientName={messageRecipient?.name || ''}
      />
    </div>
  )
}
