-- Create a bucket for project images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

-- Create the project_images table
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on project_images
alter table public.project_images enable row level security;

-- Policies for project_images (Table access) using optimized subqueries

create policy "Users can view images of their own projects"
  on public.project_images for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
      and projects.user_id = (select auth.uid())
    )
  );

create policy "Users can insert images for their own projects"
  on public.project_images for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
      and projects.user_id = (select auth.uid())
    )
  );

create policy "Users can delete images of their own projects"
  on public.project_images for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_images.project_id
      and projects.user_id = (select auth.uid())
    )
  );

-- Storage Policies (Bucket access)
-- Bucket: 'project-images'
-- Path structure: {user_id}/{filename}

create policy "Give users access to own folder project_img_s" on storage.objects
  for select
  using (bucket_id = 'project-images' and (select auth.uid()::text) = (storage.foldername(name))[1]);

create policy "Give users access to own folder project_img_i" on storage.objects
  for insert
  with check (bucket_id = 'project-images' and (select auth.uid()::text) = (storage.foldername(name))[1]);

create policy "Give users access to own folder project_img_u" on storage.objects
  for update
  using (bucket_id = 'project-images' and (select auth.uid()::text) = (storage.foldername(name))[1]);

create policy "Give users access to own folder project_img_d" on storage.objects
  for delete
  using (bucket_id = 'project-images' and (select auth.uid()::text) = (storage.foldername(name))[1]);
