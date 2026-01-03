-- Optimize policies for YARNS
DROP POLICY IF EXISTS "Users can view their own yarns" ON public.yarns;
CREATE POLICY "Users can view their own yarns" ON public.yarns FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own yarns" ON public.yarns;
CREATE POLICY "Users can insert their own yarns" ON public.yarns FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own yarns" ON public.yarns;
CREATE POLICY "Users can update their own yarns" ON public.yarns FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own yarns" ON public.yarns;
CREATE POLICY "Users can delete their own yarns" ON public.yarns FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Optimize policies for PROJECTS
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects" ON public.projects FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Optimize policies for PROJECT_YARNS
DROP POLICY IF EXISTS "Users can view their own project_yarns" ON public.project_yarns;
CREATE POLICY "Users can view their own project_yarns" ON public.project_yarns FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_yarns.project_id
    AND projects.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert their own project_yarns" ON public.project_yarns;
CREATE POLICY "Users can insert their own project_yarns" ON public.project_yarns FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_yarns.project_id
    AND projects.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own project_yarns" ON public.project_yarns;
CREATE POLICY "Users can update their own project_yarns" ON public.project_yarns FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_yarns.project_id
    AND projects.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own project_yarns" ON public.project_yarns;
CREATE POLICY "Users can delete their own project_yarns" ON public.project_yarns FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_yarns.project_id
    AND projects.user_id = (SELECT auth.uid())
  )
);

-- Optimize policies for YARN_IMAGES
DROP POLICY IF EXISTS "Users can view images of their own yarns" ON public.yarn_images;
CREATE POLICY "Users can view images of their own yarns" ON public.yarn_images FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.yarns
    WHERE yarns.id = yarn_images.yarn_id
    AND yarns.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert images for their own yarns" ON public.yarn_images;
CREATE POLICY "Users can insert images for their own yarns" ON public.yarn_images FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.yarns
    WHERE yarns.id = yarn_images.yarn_id
    AND yarns.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete images of their own yarns" ON public.yarn_images;
CREATE POLICY "Users can delete images of their own yarns" ON public.yarn_images FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.yarns
    WHERE yarns.id = yarn_images.yarn_id
    AND yarns.user_id = (SELECT auth.uid())
  )
);

-- Optimize policies for STORAGE (yarn-images bucket)
-- Casting uuid to text in select to be safe
DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_0" ON storage.objects;
CREATE POLICY "Give users access to own folder 1okq6b_0" ON storage.objects FOR SELECT USING (
  bucket_id = 'yarn-images' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_1" ON storage.objects;
CREATE POLICY "Give users access to own folder 1okq6b_1" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'yarn-images' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_2" ON storage.objects;
CREATE POLICY "Give users access to own folder 1okq6b_2" ON storage.objects FOR UPDATE USING (
  bucket_id = 'yarn-images' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Give users access to own folder 1okq6b_3" ON storage.objects;
CREATE POLICY "Give users access to own folder 1okq6b_3" ON storage.objects FOR DELETE USING (
  bucket_id = 'yarn-images' AND (SELECT auth.uid()::text) = (storage.foldername(name))[1]
);
