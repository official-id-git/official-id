import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://official.id'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/register`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ]

    try {
        const supabase = await createClient() as any

        // Dynamic blog pages
        const { data: blogs } = await supabase
            .from('blogs')
            .select('slug, updated_at')
            .eq('published', true)

        const blogPages: MetadataRoute.Sitemap = (blogs || []).map((blog: { slug: string; updated_at: string }) => ({
            url: `${baseUrl}/blog/${blog.slug}`,
            lastModified: new Date(blog.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

        // Dynamic business card pages (/c/{username})
        const { data: cards } = await supabase
            .from('business_cards')
            .select('username, updated_at')
            .eq('is_public', true)

        const cardPages: MetadataRoute.Sitemap = (cards || []).map((card: { username: string; updated_at: string }) => ({
            url: `${baseUrl}/c/${card.username}`,
            lastModified: new Date(card.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        // Dynamic badge pages (/b/{username})
        const badgePages: MetadataRoute.Sitemap = (cards || []).map((card: { username: string; updated_at: string }) => ({
            url: `${baseUrl}/b/${card.username}`,
            lastModified: new Date(card.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))

        // Dynamic circle/organization pages (/o/{username})
        const { data: orgs } = await supabase
            .from('organizations')
            .select('username, updated_at')
            .eq('is_public', true)

        const orgPages: MetadataRoute.Sitemap = (orgs || []).map((org: { username: string; updated_at: string }) => ({
            url: `${baseUrl}/o/${org.username}`,
            lastModified: new Date(org.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))

        return [
            ...staticPages,
            ...blogPages,
            ...cardPages,
            ...badgePages,
            ...orgPages,
        ]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        // Fallback to static pages only if database query fails
        return staticPages
    }
}
