-- ============================================================================
-- YarnStash Initial Schema
-- ============================================================================
-- This is the consolidated schema for YarnStash. It drops all existing tables
-- and storage objects, then recreates everything fresh with proper RLS policies.
--
-- RLS Policy Design:
-- - Each table has exactly ONE policy per action (SELECT, INSERT, UPDATE, DELETE)
-- - This avoids the "multiple permissive policies" performance issue
-- - All policies use (SELECT auth.uid()) for optimal performance
-- ============================================================================

-- ============================================================================
-- PART 1: CLEANUP - Drop existing tables and storage policies
-- ============================================================================

-- Drop tables in correct order (children before parents due to FK constraints)
DROP TABLE IF EXISTS public.project_images CASCADE;
DROP TABLE IF EXISTS public.yarn_images CASCADE;
DROP TABLE IF EXISTS public.project_yarns CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.yarns CASCADE;

-- Drop existing storage policies (use IF EXISTS to avoid errors)
DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_3" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder project_img_s" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder project_img_i" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder project_img_u" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder project_img_d" ON storage.objects;
DROP POLICY IF EXISTS "yarn_images_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "yarn_images_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "yarn_images_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "yarn_images_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "project_images_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "project_images_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "project_images_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "project_images_storage_delete" ON storage.objects;

-- Empty storage buckets (delete all objects)
DELETE FROM storage.objects WHERE bucket_id = 'yarn-images';
DELETE FROM storage.objects WHERE bucket_id = 'project-images';

-- ============================================================================
-- PART 2: CREATE TABLES
-- ============================================================================

-- Yarns table
CREATE TABLE public.yarns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  colorway text NOT NULL,
  skein_count integer NOT NULL DEFAULT 0,
  lot_number text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  ravelry_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project-Yarns junction table
CREATE TABLE public.project_yarns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  yarn_id uuid NOT NULL REFERENCES public.yarns(id) ON DELETE CASCADE,
  quantity_needed integer NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, yarn_id)
);

-- Yarn images table
CREATE TABLE public.yarn_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yarn_id uuid NOT NULL REFERENCES public.yarns(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(yarn_id, storage_path)
);

-- Project images table
CREATE TABLE public.project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, storage_path)
);

-- ============================================================================
-- PART 3: CREATE INDEXES FOR RLS PERFORMANCE
-- ============================================================================

CREATE INDEX idx_yarns_user_id ON public.yarns(user_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_project_yarns_project_id ON public.project_yarns(project_id);
CREATE INDEX idx_project_yarns_yarn_id ON public.project_yarns(yarn_id);
CREATE INDEX idx_yarn_images_yarn_id ON public.yarn_images(yarn_id);
CREATE INDEX idx_project_images_project_id ON public.project_images(project_id);

-- ============================================================================
-- PART 4: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.yarns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_yarns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yarn_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 5: RLS POLICIES - ONE POLICY PER ACTION PER TABLE
-- ============================================================================

-- -----------------------------------------------------------------------------
-- YARNS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "yarns_select" ON public.yarns
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "yarns_insert" ON public.yarns
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "yarns_update" ON public.yarns
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "yarns_delete" ON public.yarns
  FOR DELETE USING (user_id = (SELECT auth.uid()));
  WITH CHECK (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- PROJECTS policies
-- -----------------------------------------------------------------------------
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE USING (user_id = (SELECT auth.uid()));
  WITH CHECK (user_id = (SELECT auth.uid()));

-- -----------------------------------------------------------------------------
-- PROJECT_YARNS policies (check ownership via parent project)
-- -----------------------------------------------------------------------------
CREATE POLICY "project_yarns_select" ON public.project_yarns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "project_yarns_insert" ON public.project_yarns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "project_yarns_update" ON public.project_yarns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "project_yarns_delete" ON public.project_yarns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- YARN_IMAGES policies (check ownership via parent yarn)
-- -----------------------------------------------------------------------------
CREATE POLICY "yarn_images_select" ON public.yarn_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.yarns
      WHERE yarns.id = yarn_images.yarn_id
      AND yarns.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "yarn_images_insert" ON public.yarn_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.yarns
      WHERE yarns.id = yarn_images.yarn_id
      AND yarns.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "yarn_images_delete" ON public.yarn_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.yarns
      WHERE yarns.id = yarn_images.yarn_id
      AND yarns.user_id = (SELECT auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- PROJECT_IMAGES policies (check ownership via parent project)
-- -----------------------------------------------------------------------------
CREATE POLICY "project_images_select" ON public.project_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_images.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "project_images_insert" ON public.project_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_images.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "project_images_delete" ON public.project_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_images.project_id
      AND projects.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PART 6: STORAGE BUCKETS
-- ============================================================================

-- Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('yarn-images', 'yarn-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 7: STORAGE POLICIES
-- Storage path structure: {user_id}/{filename}
-- ============================================================================

-- -----------------------------------------------------------------------------
-- yarn-images bucket policies
-- -----------------------------------------------------------------------------
CREATE POLICY "yarn_images_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'yarn-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

CREATE POLICY "yarn_images_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'yarn-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

CREATE POLICY "yarn_images_storage_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'yarn-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

CREATE POLICY "yarn_images_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'yarn-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

-- -----------------------------------------------------------------------------
-- project-images bucket policies
-- -----------------------------------------------------------------------------
CREATE POLICY "project_images_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

CREATE POLICY "project_images_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

CREATE POLICY "project_images_storage_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

CREATE POLICY "project_images_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-images' 
    AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
  );

-- ============================================================================
-- DONE! Schema is ready.
-- ============================================================================
