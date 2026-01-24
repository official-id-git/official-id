'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, PaymentTransaction, UserRole, PaymentStatus } from '@/types'

interface AdminStats {
  totalUsers: number
  freeUsers: number
  paidUsers: number
  totalCards: number
  totalOrganizations: number
  pendingPayments: number
  totalRevenue: number
}

interface UserWithCards extends User {
  business_cards_count?: number
  organizations_count?: number
}

export function useAdmin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient() as any

  // Fetch admin dashboard stats
  const fetchStats = useCallback(async (): Promise<AdminStats | null> => {
    setLoading(true)
    setError(null)

    try {
      // Get user counts by role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role')

      if (usersError) throw usersError

      const totalUsers = users?.length || 0
      const freeUsers = users?.filter(u => u.role === 'FREE_USER').length || 0
      const paidUsers = users?.filter(u => u.role === 'PAID_USER').length || 0

      // Get total cards
      const { count: totalCards } = await supabase
        .from('business_cards')
        .select('*', { count: 'exact', head: true })

      // Get total organizations
      const { count: totalOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      // Get pending payments count
      const { count: pendingPayments } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING')

      // Get total revenue (approved payments)
      const { data: approvedPayments } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'APPROVED')

      const totalRevenue = approvedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      return {
        totalUsers,
        freeUsers,
        paidUsers,
        totalCards: totalCards || 0,
        totalOrganizations: totalOrganizations || 0,
        pendingPayments: pendingPayments || 0,
        totalRevenue
      }
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch all users with pagination
  const fetchUsers = useCallback(async (
    page: number = 1,
    limit: number = 20,
    search: string = '',
    roleFilter: UserRole | 'ALL' = 'ALL'
  ): Promise<{ users: UserWithCards[], total: number }> => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Apply search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Apply role filter
      if (roleFilter !== 'ALL') {
        query = query.eq('role', roleFilter)
      }

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error: fetchError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      return {
        users: data || [],
        total: count || 0
      }
    } catch (err: any) {
      setError(err.message)
      return { users: [], total: 0 }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Update user role
  const updateUserRole = useCallback(async (userId: string, newRole: UserRole): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) throw updateError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Delete user
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (deleteError) throw deleteError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch all payments with pagination
  const fetchPayments = useCallback(async (
    page: number = 1,
    limit: number = 20,
    statusFilter: PaymentStatus | 'ALL' = 'ALL'
  ): Promise<{ payments: (PaymentTransaction & { users?: User })[], total: number }> => {
    setLoading(true)
    setError(null)

    try {
      // First, fetch payments
      let query = supabase
        .from('payment_transactions')
        .select('*', { count: 'exact' })

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data: payments, error: fetchError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      // Then, fetch user details for each payment
      if (payments && payments.length > 0) {
        const userIds = [...new Set(payments.map(p => p.user_id))]

        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds)

        // Map users to payments
        const userMap = new Map(users?.map(u => [u.id, u]) || [])
        const paymentsWithUsers = payments.map(p => ({
          ...p,
          users: userMap.get(p.user_id) || undefined
        }))

        return {
          payments: paymentsWithUsers,
          total: count || 0
        }
      }

      return {
        payments: payments || [],
        total: count || 0
      }
    } catch (err: any) {
      setError(err.message)
      return { payments: [], total: 0 }
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Approve payment
  const approvePayment = useCallback(async (
    paymentId: string,
    userId: string,
    adminId: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // Update payment status
      const { error: paymentError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'APPROVED',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (paymentError) throw paymentError

      // Upgrade user to PAID_USER
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: 'PAID_USER',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (userError) throw userError

      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Reject payment
  const rejectPayment = useCallback(async (
    paymentId: string,
    adminId: string,
    reason?: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'REJECTED',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason || 'Pembayaran ditolak',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      if (updateError) throw updateError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Get single payment detail
  const fetchPaymentDetail = useCallback(async (paymentId: string): Promise<(PaymentTransaction & { users?: User }) | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('payment_transactions')
        .select('*, users(id, full_name, email, avatar_url, role)')
        .eq('id', paymentId)
        .single()

      if (fetchError) throw fetchError
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    loading,
    error,
    fetchStats,
    fetchUsers,
    updateUserRole,
    deleteUser,
    fetchPayments,
    approvePayment,
    rejectPayment,
    fetchPaymentDetail
  }
}
