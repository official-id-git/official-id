import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PublicCardClient from './PublicCardClient'

interface PageProps {
  params: Promise<{ id: string }>
}

// Generate dynamic metadata for Open Graph
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  // Check if id is UUID or Username
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  let query = supabase
    .from('business_cards')
    .select('*')
    .eq('is_public', true)

  if (isUuid) {
    query = query.eq('id', id)
  } else {
    query = query.eq('username', id)
  }

  const { data: card } = await query.single()

  if (!card) {
    return {
      title: 'Kartu Tidak Ditemukan - Official ID',
      description: 'Kartu bisnis digital tidak ditemukan',
    }
  }

  const title = `${card.full_name} - Official ID`
  const description = card.job_title && card.company
    ? `${card.job_title} di ${card.company} | Kartu Bisnis Digital Profesional`
    : card.job_title
      ? `${card.job_title} | Kartu Bisnis Digital Profesional`
      : 'Kartu Bisnis Digital Profesional'

  // Use profile photo or Official ID logo as OG image
  const ogImage = card.profile_photo_url || 'https://res.cloudinary.com/dhr9kt7r5/image/upload/v1766548116/official-id/circles/dopjzc11o9fpqdfde63b.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://official.id/c/${id}`,
      siteName: 'Official ID',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: card.full_name,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function PublicCardPage({ params }: PageProps) {
  const { id } = await params
  return <PublicCardClient cardId={id} />
}
