-- Check policies via pg_policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies WHERE tablename = 'event_payment_proofs';
