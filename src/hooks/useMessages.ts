'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Message = Database['public']['Tables']['messages']['Row']
type InsertMessage = Database['public']['Tables']['messages']['Insert']

export interface SendMessageData {
    recipient_id: string
    sender_name: string
    sender_whatsapp: string
    sender_email: string
    purpose: 'bermitra' | 'produk' | 'jasa' | 'investasi' | 'lainnya'
    message: string
}

export function useMessages() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    // Fetch all messages for the logged-in user
    const fetchMessages = useCallback(async (): Promise<Message[]> => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
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

    // Send a new message
    const sendMessage = useCallback(async (data: SendMessageData): Promise<boolean> => {
        setLoading(true)
        setError(null)

        try {
            const insertData: InsertMessage = {
                recipient_id: data.recipient_id,
                sender_name: data.sender_name,
                sender_whatsapp: data.sender_whatsapp,
                sender_email: data.sender_email,
                purpose: data.purpose,
                message: data.message,
                is_read: false,
            }

            const { error: insertError } = await supabase
                .from('messages')
                .insert(insertData)

            if (insertError) throw insertError
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // Mark a message as read
    const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', messageId)

            if (updateError) throw updateError
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        }
    }, [supabase])

    // Mark all messages as read
    const markAllAsRead = useCallback(async (): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('is_read', false)

            if (updateError) throw updateError
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        }
    }, [supabase])

    // Get count of unread messages
    const getUnreadCount = useCallback(async (): Promise<number> => {
        try {
            const { count, error: countError } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false)

            if (countError) throw countError
            return count || 0
        } catch (err: any) {
            console.error('Error getting unread count:', err)
            return 0
        }
    }, [supabase])

    // Delete a message
    const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)

            if (deleteError) throw deleteError
            return true
        } catch (err: any) {
            setError(err.message)
            return false
        }
    }, [supabase])

    return {
        loading,
        error,
        fetchMessages,
        sendMessage,
        markAsRead,
        markAllAsRead,
        getUnreadCount,
        deleteMessage,
    }
}
