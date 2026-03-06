-- =====================================================
-- Migration: Add rejection reason to KTA applications
-- Created: 2026-03-06
-- Description: Adds rejection_reason column to kta_applications
-- =====================================================

ALTER TABLE public.kta_applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
