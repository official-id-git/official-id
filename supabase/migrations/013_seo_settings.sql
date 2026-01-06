-- Create seo_settings table
create table if not exists public.seo_settings (
    id integer primary key generated always as identity,
    site_title text not null default 'Official ID',
    site_description text not null default 'Ekosistem Digital untuk Profesional',
    keywords text[] default array['official id', 'kartu nama digital', 'bisnis', 'profesional'],
    og_image_google text,
    og_image_twitter text,
    og_image_facebook text,
    og_image_linkedin text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.seo_settings enable row level security;

-- Create policies
create policy "Public read access"
    on public.seo_settings for select
    using (true);

create policy "Admin all access"
    on public.seo_settings for all
    using (
        exists (
            select 1 from public.users
            where users.id = auth.uid()
            and users.role = 'APP_ADMIN'
        )
    );

-- Insert default row if not exists
insert into public.seo_settings (id, site_title, site_description)
overriding system value
select 1, 'Official ID - Ekosistem Digital untuk Profesional', 'Platform kartu bisnis digital, networking, dan organisasi untuk profesional Indonesia'
where not exists (select 1 from public.seo_settings);

-- Trigger for updated_at
create or replace function public.handle_seo_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_seo_updated_at
    before update on public.seo_settings
    for each row
    execute function public.handle_seo_updated_at();
