-- =============================================================================
-- OFFICIAL.ID — ADD BUILDING & HERO SEASON TYPES MIGRATION
-- Run this in Supabase SQL Editor to enable 'building' & 'hero' in existing DBs
-- =============================================================================

ALTER TYPE season_type ADD VALUE IF NOT EXISTS 'building';
ALTER TYPE season_type ADD VALUE IF NOT EXISTS 'hero';
