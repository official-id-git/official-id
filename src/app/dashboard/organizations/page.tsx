'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import type { Organization } from '@/types'
import BottomNavigation from '@/components/layout/BottomNavigation'

// Reusable OrgAvatar component
function OrgAvatar({ org, colorClass }: { org: Organization, colorClass: string }) {
  const [imgError, setImgError] = useState(false)

  // Extract text color from colorClass (e.g., "from-purple-100 to-purple-200 text-purple-600" -> "text-purple-600")
  const textColorMatch = colorClass.match(/text-\w+-\d+/)
  const textColor = textColorMatch ? textColorMatch[0] : 'text-gray-600'
  const bgClass = colorClass.replace(/text-\w+-\d+/, '').trim()

  const sizeClass = "w-12 h-12 sm:w-14 sm:h-14"

  if (org.logo_url && !imgError) {
    return (
      <div className={`${sizeClass} rounded-xl overflow-hidden flex-shrink-0`}>
        <img
          src={org.logo_url}
          alt={org.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClass} bg-gradient-to-br ${bgClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <span className={`text-lg sm:text-xl font-semibold ${textColor}`}>{org.name.charAt(0)}</span>
    </div>
  )
}

export default function OrganizationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const {
    fetchMyOrganizations,
    fetchJoinedOrganizations,
    fetchPublicOrganizations,
    fetchInvitedOrganizations,
    joinOrganization,
    acceptInvitation,
    checkMembership,
    loading: orgLoading
  } = useOrganizations()

  const [myOrgs, setMyOrgs] = useState<Organization[]>([])
  const [joinedOrgs, setJoinedOrgs] = useState<Organization[]>([])
  const [publicOrgs, setPublicOrgs] = useState<Organization[]>([])
  const [invitedOrgs, setInvitedOrgs] = useState<Organization[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [joiningOrgId, setJoiningOrgId] = useState<string | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'my' | 'public' | 'invited'>('my')
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadOrgs = async () => {
      if (user) {
        setOrgsLoading(true)
        try {
          const [publicData, my, joined, invited] = await Promise.all([
            fetchPublicOrganizations(),
            fetchMyOrganizations(),
            fetchJoinedOrganizations(),
            fetchInvitedOrganizations(),
          ])

          setPublicOrgs(publicData)
          setMyOrgs(my)
          setInvitedOrgs(invited)

          const filteredJoined = joined.filter(j => !my.find(o => o.id === j.id))
          setJoinedOrgs(filteredJoined)

          const statusMap: Record<string, string> = {}
          for (const org of publicData) {
            const membership = await checkMembership(org.id)
            if (membership.status) statusMap[org.id] = membership.status
            if (membership.isOwner) statusMap[org.id] = 'OWNER'
          }
          setMembershipStatus(statusMap)

          if (invited.length > 0 && my.length === 0 && filteredJoined.length === 0) {
            setActiveTab('invited')
          }
        } catch (error) {
          console.error('Error loading organizations:', error)
        } finally {
          setOrgsLoading(false)
        }
      }
    }
    loadOrgs()
  }, [user])

  const handleJoinOrganization = async (orgId: string, isInvitation: boolean = false) => {
    setJoiningOrgId(orgId)
    setJoinMessage(null)

    try {
      const success = isInvitation ? await acceptInvitation(orgId) : await joinOrganization(orgId)

      if (success) {
        const membership = await checkMembership(orgId)
        setMembershipStatus(prev => ({ ...prev, [orgId]: membership.status || 'PENDING' }))

        if (membership.status === 'APPROVED') {
          setJoinMessage({ type: 'success', text: 'Successfully joined Circle!' })
          setInvitedOrgs(prev => prev.filter(o => o.id !== orgId))
        } else {
          setJoinMessage({ type: 'success', text: 'Join request has been sent.' })
        }

        const joined = await fetchJoinedOrganizations()
        setJoinedOrgs(joined.filter(j => !myOrgs.find(o => o.id === j.id)))
      }
    } catch (error: any) {
      setJoinMessage({ type: 'error', text: error.message || 'Failed to join' })
    } finally {
      setJoiningOrgId(null)
      setTimeout(() => setJoinMessage(null), 3000)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isPaidUser = user.role === 'PAID_USER' || user.role === 'APP_ADMIN'
  const allMyOrgs = [...myOrgs, ...joinedOrgs]

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Circle</h1>
              <p className="text-gray-500 text-sm mt-1 truncate">
                {isPaidUser ? 'Manage and explore Circle' : 'Explore Circle'}
              </p>
            </div>
            {isPaidUser && (
              <Link
                href="/dashboard/organizations/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Circle</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {joinMessage && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className={`p-4 rounded-xl ${joinMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {joinMessage.text}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${activeTab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
          >
            My Circle ({allMyOrgs.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${activeTab === 'public' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
          >
            Public ({publicOrgs.length})
          </button>
          {invitedOrgs.length > 0 && (
            <button
              onClick={() => setActiveTab('invited')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors ${activeTab === 'invited' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
            >
              Invitations ({invitedOrgs.length})
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {orgsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : activeTab === 'my' ? (
          // My Organizations
          allMyOrgs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Circle yet</h3>
              <p className="text-gray-500 mb-6">You haven't owned or joined any Circle</p>
              <button onClick={() => setActiveTab('public')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium">
                Explore Public Circle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myOrgs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-3">Circle I Manage</h3>
                  <div className="grid gap-4">
                    {myOrgs.map((org) => (
                      <Link key={org.id} href={`/dashboard/organizations/${org.id}`} className="block bg-white rounded-2xl p-4 sm:p-5 shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <OrgAvatar org={org} colorClass="from-purple-100 to-purple-200 text-purple-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate max-w-full">{org.name}</h3>
                              <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${org.is_public ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                {org.is_public ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm truncate mt-1">{org.description}</p>
                          </div>

                          {/* Desktop: Owner Badge, Mobile: Chevron */}
                          <div className="flex-shrink-0 flex items-center">
                            <span className="hidden sm:inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Owner</span>
                            <svg className="w-5 h-5 text-gray-400 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {joinedOrgs.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-3">Circle I Follow</h3>
                  <div className="grid gap-4">
                    {joinedOrgs.map((org) => (
                      <Link key={org.id} href={`/dashboard/organizations/${org.id}`} className="block bg-white rounded-2xl p-4 sm:p-5 shadow-sm border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <OrgAvatar org={org} colorClass="from-green-100 to-green-200 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                            <p className="text-gray-500 text-sm truncate mt-1">{org.description}</p>
                          </div>

                          {/* Desktop: Member Badge, Mobile: Chevron */}
                          <div className="flex-shrink-0 flex items-center">
                            <span className="hidden sm:inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Member</span>
                            <svg className="w-5 h-5 text-gray-400 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : activeTab === 'invited' ? (
          // Invited Organizations (Private)
          invitedOrgs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invitations</h3>
              <p className="text-gray-500">You don't have any invitations to private Circle</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-purple-800">You are invited to join the following private Circle.</p>
              </div>
              {invitedOrgs.map((org) => (
                <div key={org.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-200">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">

                    <div className="flex items-center gap-3 sm:gap-4 w-full">
                      <OrgAvatar org={org} colorClass="from-purple-100 to-purple-200 text-purple-600" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full flex-shrink-0">Private</span>
                        </div>
                        <p className="text-gray-500 text-sm truncate mt-1">{org.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinOrganization(org.id, true)}
                      disabled={joiningOrgId === org.id}
                      className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {joiningOrgId === org.id ? 'Processing...' : 'Accept Invitation'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Public Organizations
          publicOrgs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No public Circle yet</h3>
            </div>
          ) : (
            <div className="grid gap-4">
              {publicOrgs.map((org) => {
                const status = membershipStatus[org.id]
                const isJoined = status === 'APPROVED' || status === 'OWNER'
                const isPending = status === 'PENDING'

                return (
                  <div key={org.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">

                      <div className="flex items-center gap-3 sm:gap-4 w-full">
                        <OrgAvatar org={org} colorClass="from-blue-100 to-blue-200 text-blue-600" />
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">Public</span>
                          </div>
                          <p className="text-gray-500 text-sm truncate mt-1">{org.description}</p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex flex-shrink-0 justify-end">
                        {status === 'OWNER' ? (
                          <Link href={`/dashboard/organizations/${org.id}`} className="block w-full sm:w-auto text-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-xl">Manage</Link>
                        ) : isJoined ? (
                          <Link href={`/dashboard/organizations/${org.id}`} className="block w-full sm:w-auto text-center px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-xl">View</Link>
                        ) : isPending ? (
                          <span className="block w-full sm:w-auto text-center px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-xl">Pending</span>
                        ) : (
                          <button
                            onClick={() => handleJoinOrganization(org.id)}
                            disabled={joiningOrgId === org.id}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {joiningOrgId === org.id ? 'Processing...' : 'Join'}
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Upgrade CTA for FREE_USER */}
        {!isPaidUser && (
          <div className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Want to create your own Circle?</h3>
                <p className="text-gray-600 text-sm mb-3">Upgrade to Pro to create public or private Circle</p>
                <Link href="/dashboard/upgrade" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-sm font-medium rounded-xl">
                  Upgrade ke Pro
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation variant="organizations" />
    </div>
  )
}
