'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateQRCode, getPublicCardUrl } from '@/lib/qrcode'
import type { BusinessCard } from '@/types'

interface CreateCardData {
  full_name: string
  job_title?: string
  company?: string
  email: string
  phone: string
  website?: string
  address?: string
  city?: string
  profile_photo_url?: string
  template?: string
  username?: string
  social_links?: Record<string, string>
  is_public?: boolean
  visible_fields?: Record<string, boolean>
}

interface UpdateCardData extends Partial<CreateCardData> {
  id: string
}

export function useCards() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Helper to generate random 7-char username
  const generateRandomUsername = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Check if username is available
  const checkUsernameAvailability = useCallback(async (username: string, excludeCardId?: string): Promise<boolean> => {
    try {
      let query = supabase
        .from('business_cards')
        .select('id')
        .eq('username', username)

      if (excludeCardId) {
        query = query.neq('id', excludeCardId)
      }

      const { data, error } = await query

      if (error) throw error
      return data.length === 0
    } catch (err) {
      console.error('Error checking username:', err)
      return false
    }
  }, [supabase])

  // Ensure user exists in database before card operations
  const ensureUserExists = useCallback(async (userId: string, email: string, fullName: string) => {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!existingUser) {
        // Create user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: email,
            full_name: fullName,
            role: 'FREE_USER',
          })

        if (insertError && !insertError.message.includes('duplicate')) {
          console.warn('Could not create user profile:', insertError.message)
        }
      }
    } catch (err) {
      console.warn('ensureUserExists error:', err)
    }
  }, [supabase])

  // Fetch all cards for current user
  const fetchCards = useCallback(async (): Promise<BusinessCard[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      const { data, error: fetchError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('user_id', user.id)
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

  // Fetch single card by ID or Username
  const fetchCard = useCallback(async (idOrUsername: string): Promise<BusinessCard | null> => {
    setLoading(true)
    setError(null)

    try {
      // Try to fetch by ID first (UUID format check could prevent extra query but simple OR is okay)
      let query = supabase
        .from('business_cards')
        .select('*')

      // Basic check if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername)

      if (isUuid) {
        query = query.eq('id', idOrUsername)
      } else {
        query = query.eq('username', idOrUsername)
      }

      const { data, error: fetchError } = await query.single()

      if (fetchError) throw fetchError
      return data
    } catch (err: any) {
      // If fetched by username failed, try ID just in case logic was ambiguous, or vice versa? 
      // Actually simpler: if invalid input syntax for uuid, it failed.
      // Better approach:
      // If it's a UUID, querying by ID is safe. If it's not a UUID, querying by ID will throw 22P02.
      // So checking isUuid is good.

      // If we failed to find by ID (and it was UUID), or failed by username, try the other? 
      // No, ID is unique and username is unique. If I search by username and fail, it's not an ID (unless username LOOKS like ID but that's fine).

      // One edge case: fetching by ID might fail if I pass a username that isn't found. 
      // But typically this function is called with what we expect to be an ID from dashboard, or from public page.
      // For public page, I'll update fetchPublicCard instead.

      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch public card (no auth required) - Updated to support Username
  const fetchPublicCard = useCallback(async (idOrUsername: string): Promise<BusinessCard | null> => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('business_cards')
        .select('*')
        .eq('is_public', true)

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrUsername)

      if (isUuid) {
        query = query.eq('id', idOrUsername)
      } else {
        query = query.eq('username', idOrUsername)
      }

      const { data, error: fetchError } = await query.single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // If not found by ID (if it was UUID), it might actually be a username that *looks* like a UUID? Unlikely.
          // But if we searched by username and failed... 
          // What if the user visits /c/[username]?
          throw new Error('Kartu tidak ditemukan atau tidak publik')
        }

        // If query failed because "invalid input syntax for type uuid" (e.g. searching username against ID column), 
        // capture that? But we handled isUuid check.

        throw fetchError
      }
      return data
    } catch (err: any) {
      // If we tried searching by username and got database error, handle it
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create new card
  const createCard = useCallback(async (cardData: CreateCardData): Promise<BusinessCard | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Tidak terautentikasi')

      // IMPORTANT: Ensure user profile exists in database BEFORE creating card
      // This fixes the trigger that checks user role
      await ensureUserExists(
        user.id,
        user.email || cardData.email,
        user.user_metadata?.full_name || cardData.full_name
      )

      // Small delay to ensure user is created
      await new Promise(resolve => setTimeout(resolve, 100))

      // Generate random username if not provided
      const username = cardData.username || generateRandomUsername()

      // Prepare insert data
      const insertData: Record<string, any> = {
        user_id: user.id,
        full_name: cardData.full_name,
        job_title: cardData.job_title || null,
        company: cardData.company || null,
        email: cardData.email,
        phone: cardData.phone,
        website: cardData.website || null,
        address: cardData.address || 'belum diisi',
        city: cardData.city || 'belum diisi',
        profile_photo_url: cardData.profile_photo_url || null,
        username: username, // Add username
        social_links: cardData.social_links || {},
        is_public: cardData.is_public ?? true,
        visible_fields: cardData.visible_fields || {
          email: true,
          phone: true,
          website: true,
          social_links: true,
          address: true,
          city: true,
        },
      }

      // Try to add template if the column exists
      if (cardData.template) {
        insertData.template = cardData.template
      }

      // Insert card
      // Using a simplified retry loop for username collision would be ideal but relying on random 7 chars is very safe for now (36^7 combinations)
      // If robust, we'd check:
      /*
      let inserted = false
      let attempts = 0
      while (!inserted && attempts < 3) {
         try { ... insert ... inserted = true } catch (e) { if unique violation... generate new username ... attempts++ }
      }
      */

      const { data: newCard, error: insertError } = await supabase
        .from('business_cards')
        .insert(insertData)
        .select()
        .single()

      if (insertError) {
        // Check for specific error messages
        const errorMsg = insertError.message.toLowerCase()

        // Card limit error for FREE_USER
        if (errorMsg.includes('free_user') || insertError.code === '23514') {
          throw new Error('Akun gratis hanya dapat membuat 1 kartu. Upgrade untuk membuat lebih banyak kartu.')
        }

        // Conflict - user already has a card (from trigger)
        if (insertError.code === '23505' || errorMsg.includes('conflict') || errorMsg.includes('duplicate')) {
          // Wait, username unique constraint is also 23505.
          // User limit trigger usually raises exception, not constraint violation?
          // If it mentions "business_cards_username_key", then it's username.
          if (errorMsg.includes('username') || insertError.message.includes('business_cards_username_key')) {
            // Retry with new username?
            // For now, fail and tell user "Username not unique" if they supplied it.
            // If auto-generated, we should retry.
            if (!cardData.username) {
              // Retry logic:
              insertData.username = generateRandomUsername()
              const { data: retryCard2, error: retryError2 } = await supabase
                .from('business_cards')
                .insert(insertData)
                .select()
                .single()

              if (!retryError2) return retryCard2
            }
            throw new Error('Username sudah digunakan, silakan coba yang lain.')
          }

          throw new Error('Akun gratis hanya dapat membuat 1 kartu. Upgrade untuk membuat lebih banyak kartu.')
        }

        // If template column doesn't exist, retry without it
        if (errorMsg.includes('template') || insertError.code === '42703') {
          delete insertData.template
          const { data: retryCard, error: retryError } = await supabase
            .from('business_cards')
            .insert(insertData)
            .select()
            .single()

          if (retryError) {
            if (retryError.message.toLowerCase().includes('free_user')) {
              throw new Error('Akun gratis hanya dapat membuat 1 kartu. Upgrade untuk membuat lebih banyak kartu.')
            }
            throw retryError
          }

          // Generate QR code
          if (retryCard) {
            const publicUrl = getPublicCardUrl(retryCard.id, retryCard.username) // Use username if available
            const qrCodeUrl = await generateQRCode(publicUrl)

            const { data: updatedCard } = await supabase
              .from('business_cards')
              .update({ qr_code_url: qrCodeUrl })
              .eq('id', retryCard.id)
              .select()
              .single()

            return updatedCard || retryCard
          }
        }

        throw insertError
      }

      // Generate QR code
      const publicUrl = getPublicCardUrl(newCard.id, newCard.username)
      const qrCodeUrl = await generateQRCode(publicUrl)

      // Update card with QR code
      const { data: updatedCard, error: updateError } = await supabase
        .from('business_cards')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', newCard.id)
        .select()
        .single()

      if (updateError) {
        console.warn('QR code update error:', updateError)
        return newCard // Return card without QR if update fails
      }

      return updatedCard
    } catch (err: any) {
      console.error('createCard error:', err)
      setError(err.message)
      throw err // Re-throw so the form can catch it
    } finally {
      setLoading(false)
    }
  }, [supabase, ensureUserExists])

  // Update card
  const updateCard = useCallback(async (cardData: UpdateCardData): Promise<BusinessCard | null> => {
    setLoading(true)
    setError(null)

    try {
      const { id, template, ...restData } = cardData

      // Prepare update data
      const updateData: Record<string, any> = {
        ...restData,
        updated_at: new Date().toISOString(),
      }

      // Try to update with template first
      if (template) {
        updateData.template = template
      }

      const { data, error: updateError } = await supabase
        .from('business_cards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        // If template column doesn't exist, retry without it
        if (updateError.message.includes('template') || updateError.code === '42703') {
          delete updateData.template
          const { data: retryData, error: retryError } = await supabase
            .from('business_cards')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()
          if (retryError) throw retryError
          return retryData
        }

        // Handle unique constraint for username
        if (updateError.message.includes('username') || updateError.message.includes('business_cards_username_key')) {
          throw new Error('Username sudah digunakan, silakan pilih yang lain.')
        }

        throw updateError
      }

      // Update QR code if username changed?
      // Yes, if username changed, public URL changed.
      // But updateCard data might not have username if it didn't change.
      // Ideally we check if username was in restData and if it differed.
      // simpler: just always regenerate QR if username was passed? 
      // Or just let regenerateQRCode handle it later?
      // For now, let's assume QR code update happens on specific request or we rely on ID based QR code? 
      // User requested "username ... replaces ID"? 
      // "pengguna bisa mengganti 7 digit username ... dan tidak bisa digunakan oleh kartu bisnis pengguna yang lain"
      // If text implies the URL changes, then QR must change.

      if (cardData.username && data) {
        // regenerate QR
        const publicUrl = getPublicCardUrl(id, cardData.username)
        const qrCodeUrl = await generateQRCode(publicUrl)

        await supabase
          .from('business_cards')
          .update({ qr_code_url: qrCodeUrl })
          .eq('id', id)
      }

      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Delete card
  const deleteCard = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('business_cards')
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

  // Increment scan count
  const incrementScanCount = useCallback(async (id: string): Promise<void> => {
    try {
      await supabase.rpc('increment_card_scan', { card_id: id })
    } catch (err) {
      console.error('Error incrementing scan count:', err)
    }
  }, [supabase])

  // Regenerate QR code
  const regenerateQRCode = useCallback(async (id: string): Promise<string | null> => {
    setLoading(true)
    setError(null)

    try {
      // Need to fetch card to get username
      const { data: card } = await supabase
        .from('business_cards')
        .select('username, id')
        .eq('id', id)
        .single()

      if (!card) throw new Error('Card not found')

      const publicUrl = getPublicCardUrl(card.id, card.username)
      const qrCodeUrl = await generateQRCode(publicUrl)

      const { error: updateError } = await supabase
        .from('business_cards')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', id)

      if (updateError) throw updateError
      return qrCodeUrl
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
    fetchCards,
    fetchCard,
    fetchPublicCard,
    createCard,
    updateCard,
    deleteCard,
    incrementScanCount,
    regenerateQRCode,
    checkUsernameAvailability
  }
}
