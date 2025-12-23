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
  profile_photo_url?: string
  template?: string
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

  // Fetch single card by ID
  const fetchCard = useCallback(async (id: string): Promise<BusinessCard | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', id)
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

  // Fetch public card (no auth required)
  const fetchPublicCard = useCallback(async (id: string): Promise<BusinessCard | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Kartu tidak ditemukan atau tidak publik')
        }
        throw fetchError
      }
      return data
    } catch (err: any) {
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

      // Prepare insert data
      const insertData: Record<string, any> = {
        user_id: user.id,
        full_name: cardData.full_name,
        job_title: cardData.job_title || null,
        company: cardData.company || null,
        email: cardData.email,
        phone: cardData.phone,
        website: cardData.website || null,
        profile_photo_url: cardData.profile_photo_url || null,
        social_links: cardData.social_links || {},
        is_public: cardData.is_public ?? true,
        visible_fields: cardData.visible_fields || {
          email: true,
          phone: true,
          website: true,
          social_links: true,
        },
      }

      // Try to add template if the column exists
      if (cardData.template) {
        insertData.template = cardData.template
      }

      // Insert card
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
            const publicUrl = getPublicCardUrl(retryCard.id)
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
      const publicUrl = getPublicCardUrl(newCard.id)
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
        throw updateError
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
      const publicUrl = getPublicCardUrl(id)
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
  }
}
