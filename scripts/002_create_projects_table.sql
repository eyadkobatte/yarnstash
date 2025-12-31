-- Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.projects enable row level security;

-- Create policies for public access
create policy "Anyone can view projects"
  on public.projects for select
  using (true);

create policy "Anyone can insert projects"
  on public.projects for insert
  with check (true);

create policy "Anyone can update projects"
  on public.projects for update
  using (true);

create policy "Anyone can delete projects"
  on public.projects for delete
  using (true);
