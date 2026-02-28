'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CircleEvent, CircleEventInsert, CircleEventUpdate, EventRegistration, EventRegistrationInsert } from '@/types'

export function useEvents() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    // Helper to get table references (tables not yet in generated types)
    const eventsTable = () => (supabase as any).from('events')
    const registrationsTable = () => (supabase as any).from('event_registrations')

    const fetchEvents = async (organizationId: string, status?: string): Promise<CircleEvent[]> => {
        setLoading(true)
        try {
            let query = eventsTable()
                .select('*')
                .eq('organization_id', organizationId)
                .order('event_date', { ascending: true })

            if (status && status !== 'all') {
                query = query.eq('status', status)
            }

            const { data, error } = await query
            if (error) throw error
            return (data as CircleEvent[]) || []
        } catch (err) {
            console.error('Error fetching events:', err)
            return []
        } finally {
            setLoading(false)
        }
    }

    const fetchEvent = async (eventId: string): Promise<CircleEvent | null> => {
        try {
            const { data, error } = await eventsTable()
                .select('*')
                .eq('id', eventId)
                .single()

            if (error) throw error
            return data as CircleEvent
        } catch (err) {
            console.error('Error fetching event:', err)
            return null
        }
    }

    const createEvent = async (event: CircleEventInsert): Promise<CircleEvent | null> => {
        setLoading(true)
        try {
            const { data, error } = await eventsTable()
                .insert(event)
                .select()
                .single()

            if (error) throw error
            return data as CircleEvent
        } catch (err) {
            console.error('Error creating event:', err)
            return null
        } finally {
            setLoading(false)
        }
    }

    const updateEvent = async (eventId: string, updates: CircleEventUpdate): Promise<boolean> => {
        setLoading(true)
        try {
            const { error } = await eventsTable()
                .update(updates)
                .eq('id', eventId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error updating event:', err)
            return false
        } finally {
            setLoading(false)
        }
    }

    const deleteEvent = async (eventId: string): Promise<boolean> => {
        setLoading(true)
        try {
            const { error } = await eventsTable()
                .delete()
                .eq('id', eventId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error deleting event:', err)
            return false
        } finally {
            setLoading(false)
        }
    }

    const fetchRegistrations = async (eventId: string): Promise<EventRegistration[]> => {
        try {
            const { data, error } = await registrationsTable()
                .select('*, event_payment_proofs(*), event_tickets(*), event_rsvps(*)')
                .eq('event_id', eventId)
                .order('registered_at', { ascending: false })

            if (error) throw error
            return (data as EventRegistration[]) || []
        } catch (err) {
            console.error('Error fetching registrations:', err)
            return []
        }
    }

    const fetchRegistrationCount = async (eventId: string): Promise<number> => {
        try {
            const { count, error } = await registrationsTable()
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .neq('status', 'cancelled')

            if (error) throw error
            return count || 0
        } catch (err) {
            console.error('Error fetching count:', err)
            return 0
        }
    }

    const registerForEvent = async (registration: EventRegistrationInsert): Promise<EventRegistration | null> => {
        setLoading(true)
        try {
            const { data, error } = await registrationsTable()
                .insert(registration)
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Email sudah terdaftar untuk event ini')
                }
                throw error
            }
            return data as EventRegistration
        } catch (err: any) {
            console.error('Error registering:', err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const updateRegistrationStatus = async (registrationId: string, status: string): Promise<boolean> => {
        try {
            const { error } = await registrationsTable()
                .update({ status })
                .eq('id', registrationId)

            if (error) throw error
            return true
        } catch (err) {
            console.error('Error updating registration status:', err)
            return false
        }
    }

    return {
        loading,
        fetchEvents,
        fetchEvent,
        createEvent,
        updateEvent,
        deleteEvent,
        fetchRegistrations,
        fetchRegistrationCount,
        registerForEvent,
        updateRegistrationStatus,
    }
}
