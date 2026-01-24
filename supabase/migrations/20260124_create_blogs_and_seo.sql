-- Create blogs table if it doesn't exist
create table if not exists public.blogs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  image_url text,
  meta_title text,
  meta_description text,
  keywords text[],
  published boolean default false,
  author_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.blogs enable row level security;

-- Policy: Public can read published blogs
create policy "Public can view published blogs"
  on public.blogs for select
  using (published = true);

-- Policy: Admins can do everything
-- Note: Adjust 'APP_ADMIN' role check based on your actual auth implementation. 
-- Assuming access is controlled via application logic or a specific user role in public.users
create policy "Admins can manage blogs"
  on public.blogs for all
  using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role = 'APP_ADMIN'
    )
  );

-- Update seo_settings table to ensure it supports what we need
create table if not exists public.seo_settings (
    id bigint primary key generated always as identity,
    site_title text,
    site_description text,
    keywords text[],
    og_image_google text,
    og_image_twitter text,
    og_image_facebook text,
    og_image_linkedin text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure there is at least one row, using OVERRIDING SYSTEM VALUE to force ID=1
insert into public.seo_settings (id, site_title, site_description, keywords)
overriding system value
values (1, 'Official ID', 'Platform Kartu Nama Digital', ARRAY['official id', 'kartu nama digital'])
on conflict (id) do nothing;
