import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  const { data: regs, error: regErr } = await supabase
    .from('event_registrations')
    .select('id, name, email')
    .order('registered_at', { ascending: false })
    .limit(5)
  console.log("Registrations:", JSON.stringify(regs, null, 2))
  
  const { data: proofs, error: proofErr } = await supabase
    .from('event_payment_proofs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  console.log("Proofs:", JSON.stringify(proofs, null, 2))
}
test()
