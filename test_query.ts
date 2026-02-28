import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, name, event_payment_proofs(*)')
    .order('registered_at', { ascending: false })
    .limit(10)
  
  console.log(JSON.stringify({ data, error }, null, 2))
}
test()
