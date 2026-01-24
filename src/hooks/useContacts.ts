'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Contact {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  job_title: string | null
  source: 'manual' | 'scan' | 'import'
  scanned_image_url: string | null
  notes: string | null
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface ContactInsert {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  job_title?: string | null
  source?: 'manual' | 'scan' | 'import'
  scanned_image_url?: string | null
  notes?: string | null
}

export function useContacts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient() as any

  // Fetch all contacts
  const fetchContacts = useCallback(async (): Promise<Contact[]> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: fetchError } = await supabase
        .from('contacts')
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

  // Add contact
  const addContact = useCallback(async (contact: ContactInsert): Promise<Contact | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: insertError } = await supabase
        .from('contacts')
        .insert({
          user_id: user.id,
          ...contact
        })
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Update contact
  const updateContact = useCallback(async (id: string, updates: Partial<ContactInsert>): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Delete contact
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('contacts')
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

  // Scan business card image
  const scanBusinessCard = useCallback(async (imageUrl: string): Promise<{
    success: boolean
    contact?: Partial<ContactInsert>
    rawText?: string
    error?: string
  }> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Scan failed')
      }

      return {
        success: true,
        contact: {
          name: result.contact.name || '',
          email: result.contact.email,
          phone: result.contact.phone,
          company: result.contact.company,
          job_title: result.contact.jobTitle,
          source: 'scan',
          scanned_image_url: imageUrl
        },
        rawText: result.rawText
      }
    } catch (err: any) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Send card to contact via email
  const sendCardToContact = useCallback(async (
    contactId: string,
    cardId: string,
    message?: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get contact info
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      const contact = contactData as unknown as Contact

      if (!contact?.email) {
        throw new Error('Contact does not have email')
      }

      // Get card info
      const { data: cardData } = await supabase
        .from('business_cards')
        .select('*')
        .eq('id', cardId)
        .single()

      const card = cardData as any

      if (!card) throw new Error('Card not found')

      // Get user info
      const { data: userDataResponse } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const userData = userDataResponse as any

      // Send email via EmailJS
      const { sendContactCardEmail } = await import('@/lib/emailjs')
      const result = await sendContactCardEmail({
        recipientEmail: contact.email!,
        recipientName: contact.name,
        senderName: userData?.full_name || 'User',
        senderEmail: userData?.email || user.email!,
        cardName: card.full_name,
        cardUrl: `${window.location.origin}/c/${card.id}`,
        message,
        // Pass rich data
        cardPhotoUrl: card.photo_url,
        cardJobTitle: card.job_title,
        cardCompany: card.company
      })

      if (!result.success) {
        throw new Error(result.error || 'Gagal mengirim email')
      }

      // Update contact email_sent status
      await supabase
        .from('contacts')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString()
        } as any)
        .eq('id', contactId)

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
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    scanBusinessCard,
    sendCardToContact
  }
}
