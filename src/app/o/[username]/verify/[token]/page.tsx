import { Metadata } from 'next'
import KTAVerifyClient from './KTAVerifyClient'

interface Props {
    params: Promise<{ username: string; token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { username } = await params

    return {
        title: `Verifikasi KTA - ${username} | Official.id`,
        description: `Halaman verifikasi Kartu Tanda Anggota (KTA) dari circle ${username}`,
        robots: 'noindex',
    }
}

export default async function KTAVerifyPage({ params }: Props) {
    const { username, token } = await params

    return <KTAVerifyClient username={username} token={token} />
}
