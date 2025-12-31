-- Create junction table for projects and yarns
create table if not exists public.project_yarns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  yarn_id uuid not null references public.yarns(id) on delete cascade,
  quantity_needed integer not null default 1,
  created_at timestamp with time zone default now(),
  unique(project_id, yarn_id)
);

-- Enable RLS
alter table public.project_yarns enable row level security;

-- Create policies for public access
create policy "Anyone can view project_yarns"
  on public.project_yarns for select
  using (true);

create policy "Anyone can insert project_yarns"
  on public.project_yarns for insert
  with check (true);

create policy "Anyone can update project_yarns"
  on public.project_yarns for update
  using (true);

create policy "Anyone can delete project_yarns"
  on public.project_yarns for delete
  using (true);
