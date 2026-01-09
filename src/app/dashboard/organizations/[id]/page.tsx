'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { MemberList } from '@/components/organizations/MemberList'
import type { Organization, OrganizationMember } from '@/types'
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
    loading
  } = useOrganizations()

  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
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

      // Load invitations if admin
      if (membershipData.isAdmin && orgData) {
        const invitationsData = await fetchInvitations(orgId)
        setInvitations(invitationsData)
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
          </div>

          {/* Right Column - Members */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Invitations (Admin only) */}
            {membership.isAdmin && invitations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Invitations ({invitations.length})
                </h2>
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
              </div>
            )}

            {/* Members List */}
            <MemberList
              members={members}
              isAdmin={membership.isAdmin}
              onUpdate={loadData}
            />
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

      {/* Bottom Navigation */}
      <BottomNavigation variant="organizations" />
    </div>
  )
}
