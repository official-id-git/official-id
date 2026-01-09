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
  username?: string
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

  // Helper to generate random 7-char username
  const generateRandomUsername = useCallback((): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }, [])

  // Check if username is available
  const checkUsernameAvailability = useCallback(async (username: string, excludeOrgId?: string): Promise<boolean> => {
    try {
      let query = supabase
        .from('organizations')
        .select('id')
        .eq('username', username)

      if (excludeOrgId) {
        query = query.neq('id', excludeOrgId)
      }

      const { data } = await query.maybeSingle()
      return !data
    } catch (err) {
      console.error('Error checking username:', err)
      return false
    }
  }, [supabase])

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
      if (!user) throw new Error('Not authenticated')

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
      if (!user) throw new Error('Not authenticated')

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

  // Fetch single organization by ID or username
  const fetchOrganization = useCallback(async (idOrUsername: string): Promise<Organization | null> => {
    setLoading(true)
    setError(null)

    try {
      // Check if it's a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername)

      let query = supabase
        .from('organizations')
        .select('*')

      if (isUuid) {
        query = query.eq('id', idOrUsername)
      } else {
        query = query.eq('username', idOrUsername)
      }

      const { data, error: fetchError } = await query.maybeSingle()

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

      // Generate random username if not provided
      const username = orgData.username || generateRandomUsername()

      // Check username availability
      const isAvailable = await checkUsernameAvailability(username)
      if (!isAvailable) {
        throw new Error('Username already taken. Please choose another.')
      }

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
          username: username,
        })
        .select()
        .single()

      if (insertError) {
        // Handle username collision (retry with new random username if user didn't provide custom one)
        if (insertError.message.includes('username') || insertError.message.includes('organizations_username_key')) {
          if (!orgData.username) {
            // Retry with new random username
            const newUsername = generateRandomUsername()
            const retryData = { ...orgData, username: newUsername }
            return createOrganization(retryData)
          }
          throw new Error('Username already taken. Please choose another.')
        }

        if (insertError.message.includes('pengguna berbayar')) {
          throw new Error('Only paid users can create organizations. Please upgrade your account.')
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
  }, [supabase, generateRandomUsername, checkUsernameAvailability])

  // Update organization
  const updateOrganization = useCallback(async (orgData: UpdateOrgData): Promise<Organization | null> => {
    setLoading(true)
    setError(null)

    try {
      const { id, ...updateData } = orgData

      // If username is being updated, check availability
      if (updateData.username) {
        const isAvailable = await checkUsernameAvailability(updateData.username, id)
        if (!isAvailable) {
          throw new Error('Username already taken. Please choose another.')
        }
      }

      const { data, error: updateError } = await supabase
        .from('organizations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        // Handle username unique constraint
        if (updateError.message.includes('username') || updateError.message.includes('organizations_username_key')) {
          throw new Error('Username already taken. Please choose another.')
        }
        throw updateError
      }
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, checkUsernameAvailability])

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
      // Fetch members with user info and business cards (for search)
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select('*, users!organization_members_user_id_fkey(id, full_name, email, avatar_url, business_cards(*))')
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
      if (!user) throw new Error('Not authenticated')

      // Check if already member - use maybeSingle to avoid 406 error
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        if (existing.status === 'APPROVED') {
          throw new Error('You are already a member of this organization')
        }
        if (existing.status === 'PENDING') {
          throw new Error('Your join request is pending approval')
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
        throw new Error('You are the owner of this organization')
      }

      if (!org?.is_public) {
        throw new Error('This organization is private. You need an invitation to join.')
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
      if (!user) throw new Error('Not authenticated')

      const { data: org } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', orgId)
        .maybeSingle()

      if (org?.owner_id === user.id) {
        throw new Error('Owner cannot leave the organization. Delete the organization if you want to close it.')
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
      if (!user) throw new Error('Not authenticated')

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
      if (!user) throw new Error('Not authenticated')

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
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
          throw new Error('User with this email is already a member')
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
        throw new Error('An invitation has already been sent to this email')
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
          throw new Error('An invitation already exists for this email')
        }
        throw insertError
      }

      // Send invitation email via EmailJS
      try {
        const { sendOrgInviteEmail } = await import('@/lib/emailjs')
        await sendOrgInviteEmail({
          recipientEmail: email,
          organizationName: org?.name || 'Organisasi',
          inviterName: inviter?.full_name || 'Seseorang',
          inviterEmail: inviter?.email || '',
          appUrl: 'https://official.id'
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
      if (!user) throw new Error('Not authenticated')

      const { data: invitation } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', orgId)
        .eq('email', user.email)
        .eq('status', 'PENDING')
        .maybeSingle()

      if (!invitation) {
        throw new Error('No valid invitation found for you')
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
    generateRandomUsername,
    checkUsernameAvailability,
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
