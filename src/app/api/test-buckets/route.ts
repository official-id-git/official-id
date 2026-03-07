import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = createAdminClient() as any
    const { data, error } = await supabase.storage.listBuckets()
    return NextResponse.json({ buckets: data, error })
}
