-- Fix for "Function Search Path Mutable" security warning
-- Applies explicit search_path to storage cleanup functions

CREATE OR REPLACE FUNCTION public.delete_yarn_image_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'yarn-images' AND name = OLD.storage_path;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_project_image_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'project-images' AND name = OLD.storage_path;
  RETURN OLD;
END;
$$;
