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
  
  const { data: card } = await supabase
    .from('business_cards')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single()

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
      url: `https://pwa-official-id.vercel.app/c/${id}`,
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
