'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SeoSettings {
    id: number
    site_title: string
    site_description: string
    keywords: string[]
    og_image_google?: string | null
    og_image_twitter?: string | null
    og_image_facebook?: string | null
    og_image_linkedin?: string | null
    updated_at: string
}

export async function getSeoSettings(): Promise<SeoSettings | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .single()

    if (error) {
        if (error.code === 'PGRST116') { // No rows found
            return null
        }
        console.error('Error fetching SEO settings:', error)
        return null
    }

    return data as SeoSettings
}

export async function updateSeoSettings(data: Partial<SeoSettings>) {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userError || !userData || userData.role !== 'APP_ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }

    const { error } = await supabase
        .from('seo_settings')
        .upsert({
            id: 1, // Always update the single row with ID 1
            ...data,
            updated_at: new Date().toISOString(),
        })

    if (error) {
        console.error('Error updating SEO settings:', error)
        throw new Error('Failed to update SEO settings')
    }

    revalidatePath('/')
    revalidatePath('/dashboard/admin/seo')

    return { success: true }
}
