-- Create yarns table
create table if not exists public.yarns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  count integer not null default 0,
  color_number text,
  lot_number text,
  notes text,
  is_active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.yarns enable row level security;

-- Create policies for public access (no auth required for this app)
create policy "Anyone can view yarns"
  on public.yarns for select
  using (true);

create policy "Anyone can insert yarns"
  on public.yarns for insert
  with check (true);

create policy "Anyone can update yarns"
  on public.yarns for update
  using (true);

create policy "Anyone can delete yarns"
  on public.yarns for delete
  using (true);
