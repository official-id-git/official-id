import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PublicBadgeClient from './PublicBadgeClient'

interface PageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient() as any

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username)

  let query = supabase
    .from('business_cards')
    .select('*')

  if (isUuid) {
    query = query.eq('id', username)
  } else {
    query = query.eq('username', username)
  }

  const { data: card } = await query.single()

  if (!card) {
    return {
      title: 'Badge Tidak Ditemukan - Official ID',
      description: '3D Event Badge tidak ditemukan',
    }
  }

  const title = `3D Badge: ${card.full_name} - Official ID`
  const description = 'Interactive 3D Event Badge by Official ID'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `https://official.id/b/${username}`,
      siteName: 'Official ID',
    }
  }
}

export default async function PublicBadgePage({ params }: PageProps) {
  const { username } = await params
  return <PublicBadgeClient cardId={username} />
}
