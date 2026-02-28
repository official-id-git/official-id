'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { MemberList } from '@/components/organizations/MemberList'
import { OrganizationRequests } from '@/components/organizations/OrganizationRequests'
import type { Organization, OrganizationMember, OrganizationRequest } from '@/types'
import BottomNavigation from '@/components/layout/BottomNavigation'

interface Invitation {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const {
    fetchOrganization,
    fetchMembers,
    checkMembership,
    deleteOrganization,
    leaveOrganization,
    inviteMember,
    fetchInvitations,
    cancelInvitation,
    sendBroadcastMessage,
    fetchRequests,
    reviewRequest,
    loading
  } = useOrganizations()

  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [requests, setRequests] = useState<OrganizationRequest[]>([])
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'requests'>('members')
  const [membership, setMembership] = useState<{
    isMember: boolean
    isAdmin: boolean
    isOwner: boolean
    status: string | null
  }>({ isMember: false, isAdmin: false, isOwner: false, status: null })

  // Copy URL state
  const [copied, setCopied] = useState(false)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastError, setBroadcastError] = useState('')
  const [broadcastSuccess, setBroadcastSuccess] = useState('')

  const orgId = params.id as string

  const loadData = async () => {
    if (user && orgId) {
      const [orgData, membersData, membershipData] = await Promise.all([
        fetchOrganization(orgId),
        fetchMembers(orgId),
        checkMembership(orgId),
      ])
      setOrg(orgData)
      setMembers(membersData)
      setMembership(membershipData)

      // Load invitations and requests if admin
      if (membershipData.isAdmin && orgData) {
        const [invitationsData, requestsData] = await Promise.all([
          fetchInvitations(orgId),
          fetchRequests(orgId)
        ])
        setInvitations(invitationsData)
        setRequests(requestsData)
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [user, orgId])

  const handleDelete = async () => {
    if (!org) return
    if (!confirm(`Are you sure you want to delete Circle "${org.name}"? All members will be removed.`)) return

    const success = await deleteOrganization(org.id)
    if (success) {
      router.push('/dashboard/organizations')
    }
  }

  const handleLeave = async () => {
    if (!org) return
    if (!confirm(`Are you sure you want to leave Circle "${org.name}"?`)) return

    const success = await leaveOrganization(org.id)
    if (success) {
      router.push('/dashboard/organizations')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteLoading(true)

    try {
      const success = await inviteMember(orgId, inviteEmail)
      if (success) {
        setInviteSuccess(`Successfully invited ${inviteEmail}`)
        setInviteEmail('')
        // Reload invitations
        const invitationsData = await fetchInvitations(orgId)
        setInvitations(invitationsData)
        // Also reload members in case user already exists
        const membersData = await fetchMembers(orgId)
        setMembers(membersData)
      }
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Cancel this invitation?')) return

    const success = await cancelInvitation(invitationId)
    if (success) {
      setInvitations(prev => prev.filter(i => i.id !== invitationId))
    }
  }

  const copyToClipboard = () => {
    const url = `https://official.id/o/${org?.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareWhatsApp = () => {
    if (!org) return
    const url = `https://official.id/o/${org.username}`
    const text = `Join Circle ${org.name} on Official ID!`
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
  }

  // Broadcast message handler
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return

    setBroadcastError('')
    setBroadcastSuccess('')
    setBroadcastLoading(true)

    try {
      const result = await sendBroadcastMessage(orgId, broadcastMessage, org.name)

      if (result.success) {
        setBroadcastSuccess(`Message sent to ${result.recipientCount} members!`)
        setBroadcastMessage('')
        setTimeout(() => {
          setShowBroadcastModal(false)
          setBroadcastSuccess('')
        }, 2000)
      } else {
        setBroadcastError(result.error || 'Failed to send message')
      }
    } catch (err: any) {
      setBroadcastError(err.message || 'An error occurred')
    } finally {
      setBroadcastLoading(false)
    }
  }

  // Count words in broadcast message
  const wordCount = broadcastMessage.trim() ? broadcastMessage.trim().split(/\s+/).length : 0

  if (authLoading || loading || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const pendingCount = members.filter(m => m.status === 'PENDING').length
  const approvedCount = members.filter(m => m.status === 'APPROVED').length

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Navigation Row */}
          <div className="flex justify-between items-center mb-6">
            <Link href="/dashboard/organizations" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Circle List
            </Link>
            <div className="flex gap-2">
              {membership.isOwner && (
                <>
                  <Link
                    href={`/dashboard/organizations/${org.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
              {membership.isMember && !membership.isOwner && (
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
                >
                  Leave
                </button>
              )}
            </div>
          </div>

          {/* Org Info Row */}
          <div className="flex items-start gap-4">
            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt={org.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-purple-600">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 break-words">{org.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {org.category && (
                  <span className="text-sm text-gray-500">{org.category}</span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${org.is_public
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
                  }`}>
                  {org.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Management Button - Between header and main content */}
      {membership.isAdmin && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/dashboard/organizations/${org.id}/events`}
            className="group relative flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
          >
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

            {/* Pulse ring */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-white/30 rounded-xl animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01" />
                  <path d="M12 14h.01" />
                  <path d="M16 14h.01" />
                  <path d="M8 18h.01" />
                  <path d="M12 18h.01" />
                  <path d="M16 18h.01" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg">Event Management</h3>
              <p className="text-white/80 text-sm">Kelola event, peserta, dan pendaftaran</p>
            </div>

            <svg className="w-6 h-6 text-white/80 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600">
                {org.description || 'No description'}
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Members</span>
                  <span className="font-semibold">{approvedCount}</span>
                </div>
                {membership.isAdmin && pendingCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Pending Approval</span>
                    <span className="font-semibold text-yellow-600">{pendingCount}</span>
                  </div>
                )}
                {membership.isAdmin && invitations.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-purple-600">Pending Invitations</span>
                    <span className="font-semibold text-purple-600">{invitations.length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold">
                    {new Date(org.created_at).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${org.is_public ? 'bg-green-500' : 'bg-purple-500'}`}></span>
                  <span className="text-gray-600">
                    {org.is_public ? 'Public Circle' : 'Private Circle (invite only)'}
                  </span>
                </div>
                {org.is_public && (
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${org.require_approval ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                    <span className="text-gray-600">
                      {org.require_approval ? 'Requires admin approval' : 'Auto-join'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Public Link (if public) */}
            {org.is_public && org.username && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Public Link</h2>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`https://official.id/o/${org.username}`}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      title="Copy link"
                    >
                      {copied ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={shareWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share to WhatsApp
                  </button>
                  <p className="text-xs text-gray-500">
                    This link can be shared with anyone to view Circle info and join.
                  </p>
                </div>
              </div>
            )}

            {/* Invite Member Button (Admin only) */}
            {membership.isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Invite via Email
              </button>
            )}

            {/* Send Broadcast Button (Admin only) */}
            {membership.isAdmin && approvedCount > 1 && (
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Send Broadcast
              </button>
            )}
          </div>

          {/* Right Column - Tabs & Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Admin Tabs */}
            {membership.isAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2">
                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'members'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Members ({approvedCount})
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'requests'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Join Requests
                  {requests.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                      {requests.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('invitations')}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'invitations'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  Invitations
                  {invitations.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs">
                      {invitations.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Content Area Based on Tab */}
            {activeTab === 'requests' && membership.isAdmin ? (
              <OrganizationRequests
                requests={requests}
                onReview={reviewRequest}
                onUpdate={loadData}
              />
            ) : activeTab === 'invitations' && membership.isAdmin ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Invitations ({invitations.length})
                </h2>
                {invitations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending invitations</p>
                ) : (
                  <div className="space-y-3">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{inv.email}</p>
                            <p className="text-xs text-gray-500">
                              Invited {new Date(inv.created_at).toLocaleDateString('en-US')} •
                              Expires {new Date(inv.expires_at).toLocaleDateString('en-US')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <MemberList
                members={members}
                isAdmin={membership.isAdmin}
                onUpdate={loadData}
                organization={org ? { name: org.name, username: (org as any).username, description: (org as any).description, logo_url: (org as any).logo_url } : undefined}
                currentUserId={user?.id}
              />
            )}
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Member</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteError('')
                  setInviteSuccess('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-4">
              {org.is_public
                ? 'Invite someone to join this Circle via email.'
                : 'Private Circle can only be accessed through email invitations.'}
            </p>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200">
                {inviteSuccess}
              </div>
            )}

            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  If the email is already registered, they will be added as a member.
                  If not, the invitation will be active when they register.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                    setInviteError('')
                    setInviteSuccess('')
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading || !inviteEmail}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Send Broadcast</h2>
                <p className="text-sm text-gray-500">Message will be sent to {approvedCount - 1} member{approvedCount - 1 !== 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => {
                  setShowBroadcastModal(false)
                  setBroadcastMessage('')
                  setBroadcastError('')
                  setBroadcastSuccess('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {broadcastError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
                {broadcastError}
              </div>
            )}

            {broadcastSuccess && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200">
                {broadcastSuccess}
              </div>
            )}

            <form onSubmit={handleSendBroadcast}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write your message to all members..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    Messages appear in each member's inbox
                  </p>
                  <p className={`text-xs font-medium ${wordCount > 250 ? 'text-red-600' : wordCount > 200 ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {wordCount}/250 words
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBroadcastModal(false)
                    setBroadcastMessage('')
                    setBroadcastError('')
                    setBroadcastSuccess('')
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcastLoading || !broadcastMessage.trim() || wordCount > 250}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {broadcastLoading ? 'Sending...' : 'Send to All Members'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation variant="organizations" />
    </div>
  )
}
