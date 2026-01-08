-- Create table for logging potential exploit attempts
create table if not exists public.xploit_potential_log (
  id uuid default gen_random_uuid() primary key,
  ip_address text,
  user_agent text,
  payload text,
  event_type text not null, -- 'SQLi', 'XSS', etc.
  path text,
  user_id uuid references auth.users(id),
  severity text default 'medium', -- 'low', 'medium', 'high', 'critical'
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.xploit_potential_log enable row level security;

-- Policy: Allow inserts from authenticated and anonymous users (since exploits can come from anywhere)
create policy "Allow insert for all"
  on public.xploit_potential_log
  for insert
  with check (true);

-- Policy: Only allow admins to view logs (assuming admins have a specific role or just restricting generally for now)
-- For now, restricting to users who are admins in the app context is hard at DB level without claims,
-- so we'll restrict read to service_role or specific admin check if we had it.
-- Let's just create a policy that returns false for now for public usage, so logs are write-only for the client.
create policy "No read access for public"
  on public.xploit_potential_log
  for select
  using (false);
