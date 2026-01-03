-- Create a bucket for yarn images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('yarn-images', 'yarn-images', true)
on conflict (id) do nothing;

-- Create the yarn_images table
create table if not exists public.yarn_images (
  id uuid primary key default gen_random_uuid(),
  yarn_id uuid not null references public.yarns(id) on delete cascade,
  storage_path text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS on yarn_images
alter table public.yarn_images enable row level security;

-- Policies for yarn_images (Table access)

create policy "Users can view images of their own yarns"
  on public.yarn_images for select
  using (
    exists (
      select 1 from public.yarns
      where yarns.id = yarn_images.yarn_id
      and yarns.user_id = auth.uid()
    )
  );

create policy "Users can insert images for their own yarns"
  on public.yarn_images for insert
  with check (
    exists (
      select 1 from public.yarns
      where yarns.id = yarn_images.yarn_id
      and yarns.user_id = auth.uid()
    )
  );

create policy "Users can delete images of their own yarns"
  on public.yarn_images for delete
  using (
    exists (
      select 1 from public.yarns
      where yarns.id = yarn_images.yarn_id
      and yarns.user_id = auth.uid()
    )
  );

-- Storage Policies (Bucket access)
-- Note: 'yarn-images' is the bucket name.
-- Paths will likely be `user_id/yarn_id/filename` or just `user_id/filename` to prevent collision and allow easy policy writing.
-- Let's stick to `user_id` as folder root for simplicity in RLS.
-- Actually, checking against `yarns` table in storage policy is complex/expensive.
-- Simplest approach: Prefix with user_id. `public/yarn-images/{user_id}/{uuid}.png`

create policy "Give users access to own folder 1okq6b_0" on storage.objects
  for select
  using (bucket_id = 'yarn-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Give users access to own folder 1okq6b_1" on storage.objects
  for insert
  with check (bucket_id = 'yarn-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Give users access to own folder 1okq6b_2" on storage.objects
  for update
  using (bucket_id = 'yarn-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Give users access to own folder 1okq6b_3" on storage.objects
  for delete
  using (bucket_id = 'yarn-images' and auth.uid()::text = (storage.foldername(name))[1]);
