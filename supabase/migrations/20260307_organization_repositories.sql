-- Migration: Create organization_repositories table
-- Description: Table to store file references uploaded to Google Drive for an organization (Circle).

CREATE TABLE IF NOT EXISTS public.organization_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL,
    gdrive_file_id TEXT NOT NULL,
    gdrive_folder_id TEXT,
    gdrive_web_view_link TEXT,
    gdrive_web_content_link TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by organization quickly
CREATE INDEX IF NOT EXISTS idx_org_repos_org_id ON public.organization_repositories(organization_id);

-- Enable RLS
ALTER TABLE public.organization_repositories ENABLE ROW LEVEL SECURITY;

-- 1. Superadmin policy: CRUD on everything
CREATE POLICY "Admins can manage all repositories"
    ON public.organization_repositories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- 2. Organization Admins/Owners: CRUD on their own organization's repositories
CREATE POLICY "Org Admins can manage their organization repositories"
    ON public.organization_repositories FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
        OR
        organization_id IN (
            SELECT id FROM public.organizations
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
        OR
        organization_id IN (
            SELECT id FROM public.organizations
            WHERE owner_id = auth.uid()
        )
    );

-- 3. Approved Members: Read-Only on their organization's repositories
CREATE POLICY "Approved members can view their organization repositories"
    ON public.organization_repositories FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND status = 'APPROVED'
        )
    );

-- Trigger to update updated_at based on existing function
CREATE TRIGGER update_organization_repositories_updated_at
    BEFORE UPDATE ON public.organization_repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
