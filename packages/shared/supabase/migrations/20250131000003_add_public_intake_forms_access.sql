-- Migration: Disable RLS for intake forms table
-- Created: 2025-01-31
-- Description: Disables Row Level Security for intake_forms table to allow public access

-- Drop existing RLS policies first
DROP POLICY IF EXISTS "Organizations can manage their intake forms" ON public.intake_forms;

-- Disable RLS on intake_forms table
ALTER TABLE public.intake_forms DISABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_intake_forms_is_active ON public.intake_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_intake_forms_organization_active ON public.intake_forms(organization_id, is_active);
