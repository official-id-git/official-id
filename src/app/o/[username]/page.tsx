import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PublicCircleClient from './PublicCircleClient'

interface PageProps {
    params: Promise<{ username: string }>
}

// Generate dynamic metadata for Open Graph
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { username } = await params
    const supabase = await createClient() as any

    // Check if username is UUID or actual username
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username)

    let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_public', true)

    if (isUuid) {
        query = query.eq('id', username)
    } else {
        query = query.eq('username', username)
    }

    const { data: org } = await query.maybeSingle()

    if (!org) {
        return {
            title: 'Circle Tidak Ditemukan - Official ID',
            description: 'Circle tidak ditemukan atau tidak tersedia untuk publik',
        }
    }

    const title = `${org.name} - Official ID Circle`
    const description = org.description
        ? `${org.description} | Bergabung dengan Circle profesional di Official ID`
        : `Bergabung dengan ${org.name} di Official ID`

    // Use circle logo or default Official ID logo as OG image
    const ogImage = org.logo_url || 'https://res.cloudinary.com/dhr9kt7r5/image/upload/v1766548116/official-id/circles/dopjzc11o9fpqdfde63b.png'

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            url: `https://official.id/o/${username}`,
            siteName: 'Official ID',
            images: [
                {
                    url: ogImage,
                    width: 512,
                    height: 512,
                    alt: org.name,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    }
}

export default async function PublicCirclePage({ params }: PageProps) {
    const { username } = await params
    return <PublicCircleClient circleUsername={username} />
}
