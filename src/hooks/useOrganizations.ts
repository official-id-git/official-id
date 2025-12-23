'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, OrganizationMember } from '@/types'

interface CreateOrgData {
  name: string
  description?: string
  logo_url?: string
  category?: string
  is_public?: boolean
  require_approval?: boolean
}

interface UpdateOrgData extends Partial<CreateOrgData> {
  id: string
}

interface OrganizationInvitation {
  id: string
  organization_id: string
  email: string
  invited_by: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export function useOrganizations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch all public organizations
  const fetchPublicOrganizations = useCallback(async (): Promise<Organization[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch organizations owned by current user
  const fetchMyOrganizations = useCallback(async (): Promise<Organization[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch organizations where user is a member (not owner)
  const fetchJoinedOrganizations = useCallback(async (): Promise<Organization[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select('organization_id, organizations!inner(*)')
        .eq('user_id', user.id)
        .eq('status', 'APPROVED')
        .neq('organizations.owner_id', user.id)

      if (fetchError) throw fetchError
      return data?.map(d => d.organizations as unknown as Organization) || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single organization by ID
  const fetchOrganization = useCallback(async (id: string): Promise<Organization | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) throw fetchError
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create organization (PAID_USER only)
  const createOrganization = useCallback(async (orgData: CreateOrgData): Promise<Organization | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { data, error: insertError } = await supabase
        .from('organizations')
        .insert({
          owner_id: user.id,
          name: orgData.name,
          description: orgData.description || null,
          logo_url: orgData.logo_url || null,
          category: orgData.category || null,
          is_public: orgData.is_public ?? true,
          require_approval: orgData.require_approval ?? true,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message.includes('pengguna berbayar')) {
          throw new Error('Hanya pengguna berbayar yang dapat membuat organisasi. Silakan upgrade akun Anda.')
        }
        throw insertError
      }

      // Check if owner is already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', data.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existingMember) {
        await supabase.from('organization_members').insert({
          organization_id: data.id,
          user_id: user.id,
          status: 'APPROVED',
          is_admin: true,
          joined_at: new Date().toISOString(),
        })
      }

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Update organization
  const updateOrganization = useCallback(async (orgData: UpdateOrgData): Promise<Organization | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { id, ...updateData } = orgData

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Delete organization
  const deleteOrganization = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      // Delete invitations first (ignore errors if table doesn't exist)
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('organization_id', id)

      // Delete members
      await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', id)

      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch organization members
  const fetchMembers = useCallback(async (orgId: string): Promise<OrganizationMember[]> => {
    setLoading(true)
    setError(null)
    
    try {
      // Use explicit FK hint: users!organization_members_user_id_fkey
      // This disambiguates between user_id and approved_by foreign keys
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select('*, users!organization_members_user_id_fkey(id, full_name, email, avatar_url)')
        .eq('organization_id', orgId)
        .order('joined_at', { ascending: false })

      if (fetchError) {
        console.error('fetchMembers error:', fetchError)
        throw fetchError
      }
      return data || []
    } catch (err: any) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Request to join organization
  const joinOrganization = useCallback(async (orgId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      // Check if already member - use maybeSingle to avoid 406 error
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'APPROVED') {
          throw new Error('Anda sudah menjadi anggota organisasi ini')
        }
        if (existing.status === 'PENDING') {
          throw new Error('Permintaan bergabung Anda sedang menunggu persetujuan')
        }
        if (existing.status === 'REJECTED') {
          await supabase
            .from('organization_members')
            .delete()
            .eq('id', existing.id)
        }
      }

      // Get org settings
      const { data: org } = await supabase
        .from('organizations')
        .select('require_approval, owner_id, is_public')
        .eq('id', orgId)
        .maybeSingle()

      if (org?.owner_id === user.id) {
        throw new Error('Anda adalah pemilik organisasi ini')
      }

      if (!org?.is_public) {
        throw new Error('Organisasi ini bersifat privat. Anda memerlukan undangan untuk bergabung.')
      }

      const status = org?.require_approval ? 'PENDING' : 'APPROVED'

      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          status,
          joined_at: status === 'APPROVED' ? new Date().toISOString() : null,
        })

      if (insertError) throw insertError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Leave organization
  const leaveOrganization = useCallback(async (orgId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', orgId)
        .maybeSingle()

      if (org?.owner_id === user.id) {
        throw new Error('Pemilik tidak dapat keluar dari organisasi. Hapus organisasi jika ingin menutup.')
      }

      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', orgId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Approve/Reject member
  const updateMemberStatus = useCallback(async (
    memberId: string, 
    status: 'APPROVED' | 'REJECTED'
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const updateData: any = {
        status,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }

      if (status === 'APPROVED') {
        updateData.joined_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('organization_members')
        .update(updateData)
        .eq('id', memberId)

      if (updateError) throw updateError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Check if user is member/admin of org - FIXED: use maybeSingle instead of single
  const checkMembership = useCallback(async (orgId: string): Promise<{
    isMember: boolean
    isAdmin: boolean
    isOwner: boolean
    status: string | null
  }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { isMember: false, isAdmin: false, isOwner: false, status: null }

      // Check ownership
      const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', orgId)
        .maybeSingle()

      const isOwner = org?.owner_id === user.id

      // Check membership - use maybeSingle to avoid 406 error when no row found
      const { data: membership } = await supabase
        .from('organization_members')
        .select('status, is_admin')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle()

      return {
        isMember: membership?.status === 'APPROVED' || isOwner,
        isAdmin: membership?.is_admin || isOwner,
        isOwner,
        status: membership?.status || (isOwner ? 'APPROVED' : null),
      }
    } catch (err) {
      console.error('checkMembership error:', err)
      return { isMember: false, isAdmin: false, isOwner: false, status: null }
    }
  }, [supabase])

  // ==========================================
  // INVITATION FUNCTIONS
  // ==========================================

  const inviteMember = useCallback(async (orgId: string, email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Format email tidak valid')
      }

      // Get organization details for email
      const { data: org } = await supabase
        .from('organizations')
        .select('name, logo_url')
        .eq('id', orgId)
        .single()

      // Get inviter details
      const { data: inviter } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      // Check if user exists - use maybeSingle
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id, status')
          .eq('organization_id', orgId)
          .eq('user_id', existingUser.id)
          .maybeSingle()

        if (existingMember?.status === 'APPROVED') {
          throw new Error('Pengguna dengan email ini sudah menjadi anggota')
        }

        if (existingMember?.status === 'PENDING' || existingMember?.status === 'REJECTED') {
          await supabase
            .from('organization_members')
            .delete()
            .eq('id', existingMember.id)
        }

        await supabase.from('organization_members').insert({
          organization_id: orgId,
          user_id: existingUser.id,
          status: 'APPROVED',
          joined_at: new Date().toISOString(),
        })

        return true
      }

      // Check existing invitation
      const { data: existingInvite } = await supabase
        .from('organization_invitations')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('email', email)
        .eq('status', 'PENDING')
        .maybeSingle()

      if (existingInvite) {
        throw new Error('Undangan untuk email ini sudah dikirim dan masih aktif')
      }

      // Delete old invitations
      await supabase
        .from('organization_invitations')
        .delete()
        .eq('organization_id', orgId)
        .eq('email', email)
        .neq('status', 'PENDING')

      // Create invitation
      const { error: insertError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: orgId,
          email: email.toLowerCase(),
          invited_by: user.id,
          status: 'PENDING',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (insertError) {
        if (insertError.message.includes('unique_pending_invitation')) {
          throw new Error('Undangan untuk email ini sudah ada')
        }
        throw insertError
      }

      // Send invitation email
      try {
        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'organization_invite',
            data: {
              recipientEmail: email,
              organizationName: org?.name || 'Organisasi',
              organizationLogo: org?.logo_url,
              inviterName: inviter?.full_name || 'Seseorang',
              inviterEmail: inviter?.email || ''
            }
          })
        })
      } catch (emailErr) {
        console.error('Failed to send invitation email:', emailErr)
        // Don't fail the invitation if email fails
      }

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchInvitations = useCallback(async (orgId: string): Promise<OrganizationInvitation[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (err: any) {
      console.error('Error fetching invitations:', err)
      return []
    }
  }, [supabase])

  const cancelInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({ status: 'CANCELLED' })
        .eq('id', invitationId)

      if (updateError) throw updateError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const acceptInvitation = useCallback(async (orgId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { data: invitation } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', user.email)
        .eq('status', 'PENDING')
        .maybeSingle()

      if (!invitation) {
        throw new Error('Tidak ada undangan yang valid untuk Anda')
      }

      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: user.id,
          status: 'APPROVED',
          joined_at: new Date().toISOString(),
        })

      if (memberError && !memberError.message.includes('duplicate')) {
        throw memberError
      }

      await supabase
        .from('organization_invitations')
        .update({ status: 'ACCEPTED', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const checkInvitation = useCallback(async (orgId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return false

      const { data } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', user.email)
        .eq('status', 'PENDING')
        .maybeSingle()

      return !!data
    } catch {
      return false
    }
  }, [supabase])

  const fetchInvitedOrganizations = useCallback(async (): Promise<Organization[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return []

      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select('organization_id, organizations!inner(*)')
        .eq('email', user.email)
        .eq('status', 'PENDING')

      if (fetchError) throw fetchError
      return data?.map(d => d.organizations as unknown as Organization) || []
    } catch (err: any) {
      console.error('Error fetching invited organizations:', err)
      return []
    }
  }, [supabase])

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (deleteError) throw deleteError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    loading,
    error,
    fetchPublicOrganizations,
    fetchMyOrganizations,
    fetchJoinedOrganizations,
    fetchInvitedOrganizations,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchMembers,
    joinOrganization,
    leaveOrganization,
    updateMemberStatus,
    checkMembership,
    inviteMember,
    fetchInvitations,
    cancelInvitation,
    acceptInvitation,
    checkInvitation,
    removeMember,
  }
}
