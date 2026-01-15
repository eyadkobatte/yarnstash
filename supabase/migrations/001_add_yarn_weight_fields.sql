-- ============================================================================
-- Migration: Add Yarn Weight/Length Fields
-- ============================================================================
-- Adds total_grams as primary quantity (supports partial skeins)
-- Adds grams_per_skein and meters_per_skein as yarn specifications
-- ============================================================================

-- Add new columns
ALTER TABLE public.yarns
ADD COLUMN total_grams integer CHECK (total_grams IS NULL OR total_grams >= 0),
ADD COLUMN grams_per_skein integer CHECK (grams_per_skein IS NULL OR grams_per_skein > 0),
ADD COLUMN meters_per_skein integer CHECK (meters_per_skein IS NULL OR meters_per_skein > 0);

-- Migrate existing data: convert skein_count to grams (assume 100g/skein default)
-- Users can adjust the grams_per_skein and recalculate if specs are different
UPDATE public.yarns
SET 
  total_grams = skein_count * 100,
  grams_per_skein = 100
WHERE skein_count > 0;

-- Add comment explaining the columns
COMMENT ON COLUMN public.yarns.total_grams IS 'Total grams of yarn owned (primary quantity, supports partial skeins)';
COMMENT ON COLUMN public.yarns.grams_per_skein IS 'Grams per skein (yarn specification, from Ravelry or manual input)';
COMMENT ON COLUMN public.yarns.meters_per_skein IS 'Meters per skein (yarn specification, from Ravelry or manual input)';
