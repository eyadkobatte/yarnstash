-- Migration: Update yarn schema
-- 1. Add ravelry_id column
-- 2. Rename color to colorway
-- 3. Consolidate color_number into colorway and drop it

-- Add ravelry_id column
ALTER TABLE public.yarns ADD COLUMN IF NOT EXISTS ravelry_id integer;

-- Rename color to colorway
ALTER TABLE public.yarns RENAME COLUMN color TO colorway;

-- Consolidate existing color_number into colorway if they exist (optional but good practice)
-- This combines "Red" and "123" into "123 - Red"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'yarns' 
    AND column_name = 'color_number'
  ) THEN
    UPDATE public.yarns 
    SET colorway = color_number || ' - ' || colorway 
    WHERE color_number IS NOT NULL AND color_number != '';
  END IF;
END $$;

-- Drop color_number column
ALTER TABLE public.yarns DROP COLUMN IF EXISTS color_number;
