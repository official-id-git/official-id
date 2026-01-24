'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Blog {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string | null
    image_url: string | null
    meta_title: string | null
    meta_description: string | null
    keywords: string[] | null
    published: boolean
    author_id: string | null
    created_at: string
    updated_at: string
}

export type CreateBlogInput = Omit<Blog, 'id' | 'created_at' | 'updated_at' | 'author_id'>
export type UpdateBlogInput = Partial<CreateBlogInput>

export async function getBlogs(onlyPublished = true) {
    const supabase = await createClient()

    let query = supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })

    if (onlyPublished) {
        query = query.eq('published', true)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching blogs:', error)
        return []
    }

    return data as Blog[]
}

export async function getBlogBySlug(slug: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching blog:', error)
        return null
    }

    return data as Blog
}

export async function createBlog(input: CreateBlogInput) {
    const supabase = await createClient() as any

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Check admin role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'APP_ADMIN') throw new Error('Unauthorized: Admin only')

    const { data, error } = await supabase
        .from('blogs')
        .insert({
            ...input,
            author_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating blog:', error)
        throw new Error('Failed to create blog')
    }

    revalidatePath('/blog')
    revalidatePath('/admin')

    return data as Blog
}

export async function updateBlog(id: string, input: UpdateBlogInput) {
    const supabase = await createClient() as any

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'APP_ADMIN') throw new Error('Unauthorized: Admin only')

    const { data, error } = await supabase
        .from('blogs')
        .update({
            ...input,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating blog:', error)
        throw new Error('Failed to update blog')
    }

    revalidatePath('/blog')
    revalidatePath(`/blog/${data.slug}`)
    revalidatePath('/admin')

    return data as Blog
}

export async function deleteBlog(id: string) {
    const supabase = await createClient() as any

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userData?.role !== 'APP_ADMIN') throw new Error('Unauthorized: Admin only')

    const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting blog:', error)
        throw new Error('Failed to delete blog')
    }

    revalidatePath('/blog')
    revalidatePath('/admin')

    return { success: true }
}
